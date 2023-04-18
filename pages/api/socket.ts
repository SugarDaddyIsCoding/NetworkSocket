import { Server } from "socket.io";
let online = 0;
const onlineClients = new Map(); // create a new Map to store client data

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
    onlineClients.set(socket.id, { id: socket.id, username: "unknown" });

    // send an "update" event to all clients with the number of online clients
    io.emit("update", {
      online: onlineClients.size,
      clients: [...onlineClients.values()],
    });

    socket.on("setusername", (msg) => {
      console.log(socket.id, " wut ", onlineClients.get(socket.id));
      onlineClients.set(socket.id, { id: socket.id, username: msg });
    });

    console.log(onlineClients.size);

    socket.on("disconnect", () => {
      console.log("delete: ", socket.id);
      onlineClients.delete(socket.id);

      io.emit("update", {
        online: onlineClients.size,
        clients: [...onlineClients.values()],
      });
      // send an "update" event to all clients with the updated online client data

      console.log("Disconnected!!", onlineClients.size);
      // Get a list of all active sockets
    });
  };

  io.on("connection", onConnection); //auto

  console.log("Setting up socket with ", online);
  res.end();
}
