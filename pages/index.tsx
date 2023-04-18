import Image from "next/image";

import io from "socket.io-client";
import { useState, useEffect } from "react";

let socket;

export default function Home() {
  const [hi, setHi] = useState("");
  useEffect(() => {
    socketInitializer();
    return () => {
      socket.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch("/api/socket");
    console.log(g);

    setHi("FUCKING DADDY");

    socket = io("http://localhost:3000");
  };

  return (
    <>
      <div className="text-red-900">FUCK YOU {hi}</div>
      <button className="px-4 py-2 bg-slate-300" onClick={() => {}}>
        MANA
      </button>
    </>
  );
}
