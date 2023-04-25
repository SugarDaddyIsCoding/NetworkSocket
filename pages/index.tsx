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
  const [onlineChat, setOnlineChat] = useState();

  const [currentmessage, setCurrentmessage] = useState([]);

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch("/api/socket");

    console.log(g);

    socket = io();
    //everytime server send new data, all the client update state
    socket.on("update", (num) => {
      console.log("uso janai", num);
      console.log(num.clients.length);
      setOnlineUser(num.clients);
      setOnlineChat(num.chatroom);
    });

    socket.on("boardcastmessage", (tosend) => {
      console.log("incoming", tosend);

      setCurrentmessage((prevMessages) => [...prevMessages, tosend]);
    });
  };

  const Createuser = async (event) => {
    event.preventDefault();
    await socketInitializer(); //init new user everytime u click create username button
    const newusername = event.target.setusername.value;
    console.log(newusername);
    socket.emit("setusername", newusername);
  };

  const Createmes = async (event) => {
    event.preventDefault();
    const messagedata = {
      newmessage: event.target.chatmessage.value,
      chatroomid: event.target.chatroomid.value,
    };
    console.log(messagedata);
    if (socket) {
      console.log("send!!");
      socket.emit("sendmessage", messagedata);
    } else {
      console.log("no socket");
    }
    event.target.chatmessage.value = "";
  };

  return (
    <>
      <h1 className="text-4xl">Currently Online User: {onlineUser?.length}</h1>
      <form onSubmit={Createuser}>
        <label>Set Nickname</label>
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
          {data?.joinedroom?.map((data, index) => (
            <div key={index}>Chatroom ID: {data}</div>
          ))}
        </div>
      ))}

      <div className="bg-slate-100">
        <button
          onClick={() => {
            if (socket) {
              socket.emit("createchatroom");
            } else {
              alert("Create Client first");
            }
          }}
          className="px-4 border-red-500 bg-blue-200  py-2"
        >
          Create and join chatroom
        </button>
      </div>
      <h1>List Of Available Chatroom</h1>
      {onlineChat?.map((data, index) => (
        <div key={index}>
          <div>
            Chatroom ID: {data.chatroomid} with size {data.member.length}
          </div>
          {data?.member?.map((data, index) => (
            <div key={index}>Member Socket ID: {data}</div>
          ))}
          <button
            onClick={() => {
              if (socket) {
                socket.emit("joinchatroom", data.chatroomid);
              } else {
                alert("Create Client first");
              }
            }}
            className="bg-lime-300 px-4 py-2 rounded-xl"
          >
            Join
          </button>
          <form onSubmit={Createmes}>
            <input
              id="chatmessage"
              className="px-4 py-2 bg-yellow-100 border-blue-600"
            />
            <input
              className="hidden"
              id="chatroomid"
              value={data.chatroomid}
            ></input>
            <button className="px-4 py-2 bg-pink-200">Send</button>
          </form>

          <button className="bg-red-300 px-4 py-2 rounded-xl"
            onClick={() => {
              if (socket) {
                socket.emit("leaveroom", data.chatroomid);
              } else {
                alert("Create Client first");
              }
            }}>
            Leave
          </button>
        </div>
      ))}

      <h1>Message In Chatroom</h1>
      {currentmessage?.map((data, index) => (
        <div key={data}>
          <li>
            {data.sender}: {data.newmessage}
          </li>
        </div>
      ))}
    </>
  );
}
