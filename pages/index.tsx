import Image from "next/image";

import io from "socket.io-client";
import { useState, useEffect } from "react";

let socket;

export default function Home() {
  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit("rdytodelete", socket.id, () => {
          socket.disconnect(true);
        });
      }
    };
  }, []);

  const [onlineUser, setOnlineUser] = useState();

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch("/api/socket");

    console.log(g);

    socket = io();

    socket.on("update", (num) => {
      console.log("uso janai", num.clients);
      console.log(num.clients.length);
      setOnlineUser(num.clients);
    });
  };

  const Createuser = async (event) => {
    event.preventDefault();
    await socketInitializer();
    const newusername = event.target.setusername.value;
    console.log(newusername);
    socket.emit("setusername", newusername);
  };

  return (
    <>
      <h1 className="text-4xl">Currently Online User: {onlineUser?.length}</h1>
      <form onSubmit={Createuser}>
        <input
          id="setusername"
          className="border-red-300 py-2 px-4 bg-slate-100 rounded m-3"
        ></input>
        <button className="px-4 border-red-500 bg-blue-200  py-2">GO</button>
      </form>
      {onlineUser?.map((data, index) => (
        <div key={index}>
          <span className="bg-red-200">Socket ID:{data.id}</span>
          <span className="bg-yellow-200">Username: {data.username}</span>
        </div>
      ))}
    </>
  );
}
