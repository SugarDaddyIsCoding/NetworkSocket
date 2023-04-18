import Image from "next/image";

import io from "socket.io-client";
import { useState, useEffect } from "react";

let socket;

export default function Home() {
  useEffect(() => {
    socketInitializer();
    return () => {
      socket.emit("rdytodelete", socket.id, () => {
        socket.disconnect(true);
      });
    };
  }, []);

  const [onlineUser, setOnlineUser] = useState();

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch("/api/socket");

    console.log(g);

    socket = io();

    socket.on("update", (num) => {
      console.log("uso janai", num);
      setOnlineUser(num.online);
    });

    socket.emit("setusername", "hohohaha");
  };

  return (
    <>
      <h1 className="text-4xl">Currently Online User: {onlineUser}</h1>

      <button className="px-4 py-2 bg-slate-300" onClick={() => {}}>
        MANA
      </button>
    </>
  );
}
