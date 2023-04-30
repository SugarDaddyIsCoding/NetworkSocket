import {
  onlineChatroomT,
  onlineChatroom,
  getNewServerIO,
  onlineClients,
} from '@/share/context'
import { SocketEvents } from '@/types/events'
import { Server } from 'socket.io'
import { ChatCompletionRequestMessage } from 'openai-streams'

// variables for "is typing" function
let userTimers = new Map<string, NodeJS.Timeout | undefined>()
let typingUsers = new Array<string>()
const typingTimeout = 5000

export default function SocketHandler(req, res) {
  // It means that socket server was already initialised
  if (res.socket.server.io) {
    //console.log("Already set up");
    res.end()
    return
  }

  const io = getNewServerIO(res.socket.server)
  res.socket.server.io = io

  const onConnection = (socket) => {
    //new client joined!
    onlineClients.set(socket.id, {
      id: socket.id,
      username: 'unknown',
      joinedroom: [],
    })

    // send an "update" event to all clients with the number of online clients
    update(io)

    socket.on(SocketEvents.SetUserName, (msg) => {
      //Set username
      if (msg !== '') {
        onlineClients.set(socket.id, {
          id: socket.id,
          username: msg,
          joinedroom: [],
        })
      } else {
        onlineClients.set(socket.id, {
          id: socket.id,
          username: 'No name',
          joinedroom: [],
        })
      }
      //after set username uodate to every client
      update(io)
    })

    socket.on(
      SocketEvents.CreateChatroom,
      ({ roomName, isAbdul, trueIndexes }, callback) => {
        console.log('WTF ', trueIndexes)

        //create new chatroom and put that client into the new created chatroom
        socket.join(startchatroomid.toString())
        const existingUser = onlineClients.get(socket.id)

        const newroom: Array<string> = existingUser.joinedroom
        newroom.push(startchatroomid.toString())
        //console.lognewroom);
        onlineClients.set(socket.id, { ...existingUser, joinedroom: newroom })

        onlineChatroom.set(startchatroomid.toString(), {
          chatroomid: startchatroomid.toString(),
          member: [socket.id],
          roomName,
          isAbdul,
          category: trueIndexes,
        })

        //console.log("in socket.io handler");
        //console.log(onlineChatroom);
        //console.log("****************");

        update(io) //reupdate after created chatroom
        //console.logonlineClients.values());

        //console.log("joined!!");
        callback({
          socketid: startchatroomid.toString(),
          roomName,
          trueIndexes,
        })

        startchatroomid++ //make this is unique
      }
    )

    socket.on(SocketEvents.JoinChatroom, (chatroomid) => {
      const currentChatroom = onlineChatroom.get(chatroomid)
      if (currentChatroom === undefined) {
        //console.log("undefined chat room");
        return
      }

      //Like create chatroom but join instead, use the chatroom id passed from frontend
      if (currentChatroom.member.includes(socket.id)) {
        //if already in that chatroom, don't join
        //console.log("already in this chatroom!");
        return
      }
      socket.join(chatroomid)

      const existingUser = onlineClients.get(socket.id)

      const newroom: Array<string> = existingUser.joinedroom
      newroom.push(chatroomid)
      //console.lognewroom);
      onlineClients.set(socket.id, { ...existingUser, joinedroom: newroom })

      const newmember: Array<string> = currentChatroom.member
      newmember.push(socket.id)
      onlineChatroom.set(chatroomid, {
        ...currentChatroom,
        member: newmember,
      })

      update(io)
      //console.log(socket.id, "successfully joined room", chatroomid);
    })

    socket.on(SocketEvents.LeaveRoom, (chatroomid) => {
      const currentChatroom = onlineChatroom.get(chatroomid)
      if (!currentChatroom) {
        return
      }

      //Like create chatroom but leave instead, use the chatroom id passed from frontend
      if (!currentChatroom.member.includes(socket.id)) {
        //if not in that chatroom, can't leave
        //console.log("not in the chatroom!");
        return
      }
      socket.leave(chatroomid)

      const me = onlineClients.get(socket.id)

      // remove the room from my joined rooms
      let myrooms: Array<string> = me.joinedroom
      myrooms = myrooms.filter((roomId) => roomId !== chatroomid)

      // update the state in onlineClients
      onlineClients.set(socket.id, { ...me, joinedroom: myrooms })

      // remove me from the currentChatroom
      let newmember: Array<string> = currentChatroom.member
      newmember = newmember.filter((member) => member !== socket.id)

      // update the state of onlineChatroom
      onlineChatroom.set(chatroomid, {
        ...currentChatroom,
        member: newmember,
      })

      update(io)

      //remove him from the typingUsers List
      typingUsers = typingUsers.filter((userId) => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map((u) => [
          u,
          onlineClients.get(u).username as string,
        ]),
      })

      //console.log(socket.id, "successfully leave room", chatroomid);
    })

    socket.on(SocketEvents.SendMessage, (messagedata) => {
      //remove him from the typingUsers List
      typingUsers = typingUsers.filter((userId) => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map((u) => [
          u,
          onlineClients.get(u).username as string,
        ]),
      })

      //need to check if that user is in that chatroom

      const currentclient = onlineClients.get(socket.id)
      if (currentclient.joinedroom.includes(messagedata.chatroomid)) {
        const tosend = {
          newmessage: messagedata.newmessage,
          sender: currentclient.username,
        }

        io.in(messagedata.chatroomid).emit(
          SocketEvents.BroadCastMessage,
          tosend
        )
      } else {
        //console.log("can't send not in this chatroom");
      }
    })

    // ABDUL: Broadcast abdul message for every users in the same chatroom
    socket.on(
      SocketEvents.AbdulMessage,
      ({ chatRoomId, message }: { chatRoomId: string; message: string }) => {
        console.log('on: AbdulMessage')
        console.log({ message })
        io.in(chatRoomId).emit(SocketEvents.BroadcastAbdulMessage, {
          message,
        })
      }
    )

    // ABDUL: Broadcast abdul response for every users in the same chatroom
    socket.on(
      SocketEvents.AbdulResponse,
      ({
        chatRoomId,
        response,
        cursor,
      }: {
        chatRoomId: string
        response: string
        cursor: boolean
      }) => {
        console.log('on: AbdulResponse')
        console.log({
          chatRoomId,
          response,
          cursor,
        })
        io.in(chatRoomId).emit(SocketEvents.BroadcastAbdulResponse, {
          response,
          cursor,
        })
      }
    )

    socket.on(SocketEvents.Typing, () => {
      // delete countdown timer if any

      const me: string = socket.id
      clearTimeout(userTimers.get(me))
      userTimers.set(me, undefined)

      // add the user to the list of typingUsers
      if (!typingUsers.includes(me)) {
        typingUsers.push(me)
      }

      //console.log("typingUsers");
      //console.log(typingUsers);

      // emit an updateTypers event to client
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map((u) => [u, onlineClients.get(u).username]),
      })

      // startTimer for this dude, in the callback
      // do - remove him from the list typingUsers
      // do - remove the timer from userTimers (not sure)
      // emit an updateTypers event to client
      //
      // In this code, setTimeout() is called with an anonymous function that returns another function.
      // This allows us to pass additional parameters (me) to the function that will be used after the delay.
      //
      // so even though me would change later, the current me that is passed when setTimeout is called will be used.
      let timerId = setTimeout(
        ((me: string): (() => void) => {
          return () => {
            //console.log("typing timeout for ", me);
            typingUsers = typingUsers.filter((userId) => userId !== me)
            io.emit(SocketEvents.UpdateTypingUsers, {
              typingUsers: typingUsers.map((u) => [
                u,
                onlineClients.get(u).username as string,
              ]),
            })
          }
        })(me),
        typingTimeout
      )

      userTimers.set(me, timerId)
    })

    socket.on('disconnect', () => {
      //console.log("delete: ", socket.id);
      onlineClients.delete(socket.id) //remove disconnected client

      // remove them from any group chats
      onlineChatroom.forEach((room, roomId) => {
        if (room.member.includes(socket.id)) {
          room.member = room.member.filter((u) => u != socket.id)
        }
      })

      update(io)
      // send an "update" event to all clients with the updated online client data

      //console.log("Disconnected!!", onlineClients.size);
      // Get a list of all active sockets

      //remove him from the typingUsers List
      typingUsers = typingUsers.filter((userId) => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map((u) => [
          u,
          onlineClients.get(u).username as string,
        ]),
      })
    })

    //reuse function
  }

  io.on('connection', onConnection) //auto

  //console.log("Setting up socket with ");
  res.end()
}

//This f(x) use to update the new data and make every client see the same set of data
const update = (ioInstance: Server) => {
  console.log('emitting updates')
  ioInstance.emit(SocketEvents.UpdateRoomsAndUsers, {
    online: onlineClients.size,
    clients: [...onlineClients.values()],
    chatroom: [...onlineChatroom.values()],
  })
}

// runner for cleanup function
export const runCleanup = () => {
  // //console.log("in run cleanup");
  // //console.log(onlineChatroom);
  cleanup(onlineChatroom)
  const nextTimeout =
    parseInt(process.env.EMPTYROOM_CLEANUP_INTERVAL as string) * 1000
  console.log(nextTimeout)
  setTimeout(runCleanup, nextTimeout)

  const currentTime = new Date().getTime() // Get the current time in milliseconds
  const oneMinuteLater = new Date() // Create a new Date object
  oneMinuteLater.setTime(currentTime + nextTimeout) // Set the time of the new Date object to nextTimeout milliseconds later
  const hours = oneMinuteLater.getHours().toString().padStart(2, '0') // Get the hours and pad with leading zero if necessary
  const minutes = oneMinuteLater.getMinutes().toString().padStart(2, '0') // Get the minutes and pad with leading zero if necessary
  const seconds = oneMinuteLater.getSeconds().toString().padStart(2, '0') // Get the seconds and pad with leading zero if necessary
  const timeString = `${hours}:${minutes}:${seconds}` // Create the time string in hh:mm:ss format
  console.log('next clean up at', timeString)
}

// cleanup function that will remove any empty chat room
const cleanup = (onlineRooms: onlineChatroomT) => {
  // //console.log(onlineRooms);

  let removingId: string[] = []
  onlineRooms.forEach((room, roomId) => {
    if (room.member.length === 0) {
      removingId.push(roomId)
    }
  })
  removingId.forEach((id) => onlineRooms.delete(id))

  if (removingId.length > 0) {
    const io = getNewServerIO()

    if (io != undefined) {
      update(io)
    }
  }
}
