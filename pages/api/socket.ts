import { SocketEvents } from "@/types/events";
import { Server } from "socket.io";
let startchatroomid = 0; //global variable for chatroom id
const onlineClients = new Map(); // create a new Map to store client data
const onlineChatroom = new Map(); //Create a  new map to save a chatroom and all the client in each on

// variables for "is typing" function
let userTimers = new Map<string, NodeJS.Timeout | undefined>();
let typingUsers = new Array<string>();
const typingTimeout = 5000;

export default function SocketHandler(req, res) {
  // It means that socket server was already initialised
  if (res.socket.server.io) {
    console.log("Already set up");
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  const onConnection = (socket) => {
    //new client joined!
    onlineClients.set(socket.id, {
      id: socket.id,
      username: "unknown",
      joinedroom: [],
    });

    // send an "update" event to all clients with the number of online clients
    update();

    socket.on(SocketEvents.SetUserName, (msg) => {
      //Set username
      if (msg !== "") {
        onlineClients.set(socket.id, {
          id: socket.id,
          username: msg,
          joinedroom: [],
        });
      } else {
        onlineClients.set(socket.id, {
          id: socket.id,
          username: "No name",
          joinedroom: [],
        });
      }
      //after set username uodate to every client
      update();
    });

    socket.on(SocketEvents.CreateChatroom, (callback) => {
      //create new chatroom and put that client into the new created chatroom
      socket.join(startchatroomid.toString());
      const existingUser = onlineClients.get(socket.id);

      const newroom: Array<string> = existingUser.joinedroom;
      newroom.push(startchatroomid.toString());
      //console.log(newroom);
      onlineClients.set(socket.id, { ...existingUser, joinedroom: newroom });

      onlineChatroom.set(startchatroomid.toString(), {
        chatroomid: startchatroomid.toString(),
        member: [socket.id],
      });

      //console.log(onlineChatroom);

      update(); //reupdate after created chatroom
      //console.log(onlineClients.values());

      console.log("joined!!");
      callback({ socketid: startchatroomid.toString() });

      startchatroomid++; //make this is unique
    });

    socket.on(SocketEvents.JoinChatroom, (chatroomid) => {
      const currentChatroom = onlineChatroom.get(chatroomid);
      //Like create chatroom but join instead, use the chatroom id passed from frontend
      if (currentChatroom.member.includes(socket.id)) {
        //if already in that chatroom, don't join
        console.log("already in this chatroom!");
        return;
      }
      socket.join(chatroomid);

      const existingUser = onlineClients.get(socket.id);

      const newroom: Array<string> = existingUser.joinedroom;
      newroom.push(chatroomid);
      //console.log(newroom);
      onlineClients.set(socket.id, { ...existingUser, joinedroom: newroom });

      const newmember: Array<string> = currentChatroom.member;
      newmember.push(socket.id);
      onlineChatroom.set(chatroomid, {
        ...currentChatroom,
        member: newmember,
      });

      update();
      console.log(socket.id, "successfully joined room", chatroomid);
    });

    socket.on(SocketEvents.LeaveRoom, (chatroomid) => {
      const currentChatroom = onlineChatroom.get(chatroomid);
      //Like create chatroom but leave instead, use the chatroom id passed from frontend
      if (!currentChatroom.member.includes(socket.id)) {
        //if not in that chatroom, can't leave
        console.log("not in the chatroom!");
        return;
      }
      socket.leave(chatroomid);

      const me = onlineClients.get(socket.id);

      // remove the room from my joined rooms
      let myrooms: Array<string> = me.joinedroom;
      myrooms = myrooms.filter((roomId) => roomId !== chatroomid);

      // update the state in onlineClients
      onlineClients.set(socket.id, { ...me, joinedroom: myrooms });

      // remove me from the currentChatroom
      let newmember: Array<string> = currentChatroom.member;
      newmember = newmember.filter((member) => member !== socket.id);

      // update the state of onlineChatroom
      onlineChatroom.set(chatroomid, {
        ...currentChatroom,
        member: newmember,
      });

      update();

      //remove him from the typingUsers List
      typingUsers = typingUsers.filter(userId => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map(u => [u, onlineClients.get(u).username as string])
      });

      console.log(socket.id, "successfully leave room", chatroomid);
    });

    socket.on(SocketEvents.SendMessage, (messagedata) => {
      //remove him from the typingUsers List
      typingUsers = typingUsers.filter(userId => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map(u => [u, onlineClients.get(u).username as string])
      });

      //need to check if that user is in that chatroom

      const currentclient = onlineClients.get(socket.id);
      if (currentclient.joinedroom.includes(messagedata.chatroomid)) {
        const tosend = {
          newmessage: messagedata.newmessage,
          sender: currentclient.username,
        };

        io.in(messagedata.chatroomid).emit(SocketEvents.BroadCastMessage, tosend);
      } else {
        console.log("can't send not in this chatroom");
      }
    });



    socket.on(SocketEvents.Typing, () => {

      // delete countdown timer if any
      const me: string = socket.id;
      clearTimeout(userTimers.get(me));
      userTimers.set(me, undefined);

      // add the user to the list of typingUsers
      if (!typingUsers.includes(me)) {
        typingUsers.push(me);
      }

      console.log("typingUsers");
      console.log(typingUsers);

      // emit an updateTypers event to client
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map(u => [u, onlineClients.get(u).username])
      });



      // startTimer for this dude, in the callback
      // do - remove him from the list typingUsers
      // do - remove the timer from userTimers (not sure)
      // emit an updateTypers event to client
      let timerId = setTimeout(((me: string): (() => void) => {
        return () => {
          console.log("typing timeout for ", me);
          typingUsers = typingUsers.filter(userId => userId !== me)
          io.emit(SocketEvents.UpdateTypingUsers, {
            typingUsers: typingUsers.map(u => [u, onlineClients.get(u).username as string])
          });
        }
      })(me), typingTimeout);

      userTimers.set(me, timerId);

    })

    socket.on("disconnect", () => {
      console.log("delete: ", socket.id);
      onlineClients.delete(socket.id); //remove disconnected client

      update();
      // send an "update" event to all clients with the updated online client data

      console.log("Disconnected!!", onlineClients.size);
      // Get a list of all active sockets


      //remove him from the typingUsers List
      typingUsers = typingUsers.filter(userId => userId !== socket.id)
      io.emit(SocketEvents.UpdateTypingUsers, {
        typingUsers: typingUsers.map(u => [u, onlineClients.get(u).username as string])
      });
    });

    //reuse function
  };

  //This f(x) use to update the new data and make every client see the same set of data
  const update = () => {
    io.emit(SocketEvents.UpdateRoomsAndUsers, {
      online: onlineClients.size,
      clients: [...onlineClients.values()],
      chatroom: [...onlineChatroom.values()],
    });
  };

  io.on("connection", onConnection); //auto

  console.log("Setting up socket with ");
  res.end();
}
