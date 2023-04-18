import { Server } from "socket.io";
let startchatroomid = 0;
const onlineClients = new Map(); // create a new Map to store client data
const onlineChatroom = new Map();
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
    onlineClients.set(socket.id, {
      id: socket.id,
      username: "unknown",
      joinedroom: [],
    });

    // send an "update" event to all clients with the number of online clients
    update();

    socket.on("setusername", (msg) => {
      // console.log(
      //   socket.id,
      //   " wut ",
      //   onlineClients.get(socket.id),
      //   "new name ",
      //   msg
      // );
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

      update();
    });

    socket.on("createchatroom", () => {
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

      update();
      //console.log(onlineClients.values());

      console.log("joined!!");

      startchatroomid++;
    });

    socket.on("joinchatroom", (chatroomid) => {
      const currentChatroom = onlineChatroom.get(chatroomid);

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
    });

    socket.on("disconnect", () => {
      console.log("delete: ", socket.id);
      onlineClients.delete(socket.id);

      update();
      // send an "update" event to all clients with the updated online client data

      console.log("Disconnected!!", onlineClients.size);
      // Get a list of all active sockets
    });

    //reuse function
  };

  const update = () => {
    io.emit("update", {
      online: onlineClients.size,
      clients: [...onlineClients.values()],
      chatroom: [...onlineChatroom.values()],
    });
  };

  io.on("connection", onConnection); //auto

  console.log("Setting up socket with ");
  res.end();
}
