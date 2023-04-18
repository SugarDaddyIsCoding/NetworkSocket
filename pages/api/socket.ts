import { Server } from "socket.io";
let a = 0;

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
    a++;
    console.log(a);

    socket.on("disconnect", onDisconnect);
  };

  const onDisconnect = (socket) => {
    a--;
    console.log("Disconnected!!", a);
  };
  const hi = () => {
    console.log("yo");
  };

  io.on("connection", onConnection); //auto

  console.log("Setting up socket with ", a);
  res.end();
}
