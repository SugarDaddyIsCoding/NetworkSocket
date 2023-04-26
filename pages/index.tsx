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
  const [mode, setMode] = useState(0);
  const [currentChatroom, setCurrentchatroom] = useState();
  const [currentmessage, setCurrentmessage] = useState([]);
  const [theme, setTheme] = useState(true); //true = dark mode

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
    setMode(1);
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
    <div
      className={
        theme
          ? " bg-slate-950 text-white w-screen h-screen relative"
          : " bg-white text-black w-screen h-screen relative"
      }
    >
      <button
        onClick={() => {
          setTheme(!theme);
          console.log(theme);
        }}
        className="px-4 absolute top-2 z-10 right-0 py-2 bg-yellow-400"
      >
        Change Mode
      </button>
      {mode === 0 && (
        <div className="flex pt-5 items-center justify-center ">
          <div>
            <h1 className="text-4xl mb-5 flex justify-center items-center">
              I want it that way{" "}
            </h1>
            <form onSubmit={Createuser}>
              <label className="">Set Nickname</label>
              <input
                id="setusername"
                className={
                  theme
                    ? "border-red-300 bg-slate-600 py-2 px-4 rounded m-3"
                    : "border-red-300 bg-slate-200 py-2 px-4 rounded m-3"
                }
              ></input>
              <button className="px-4 border-red-500 bg-blue-500  py-2">
                GO
              </button>
            </form>
          </div>
        </div>
      )}
      {mode === 1 && (
        <div className="p-5 ">
          <h1 className="text-4xl flex justify-center ">
            Currently Online User: {onlineUser?.length}
          </h1>
          <div className="bg-slate-300 text-black bg-opacity-30 mt-5 py-5 rounded-lg">
            {onlineUser?.map((data, index) => (
              <div key={index}>
                <span className="bg-red-200">Socket ID:{data.id}</span>
                <span className="bg-yellow-200">Username: {data.username}</span>
                {data?.joinedroom?.map((data, index) => (
                  <div key={index}>Chatroom ID: {data}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="">
            <button
              onClick={() => {
                if (socket) {
                  socket.emit("createchatroom", (response) => {
                    setCurrentchatroom(response.socketid);
                    setMode(2);
                  });
                } else {
                  alert("Create Client first");
                }
              }}
              className="px-4 rounded-xl border-red-500 bg-blue-600  py-2"
            >
              Create and join chatroom
            </button>
          </div>
          <h1 className=" text-2xl justify-center flex">
            List Of Available Chatroom
          </h1>
          <div className="grid mt-5 grid-cols-3 gap-5">
            {onlineChat?.map((data, index) => (
              <div
                className="bg-violet-500 bg-opacity-60 p-5 rounded-xl"
                key={index}
              >
                <div>
                  Chatroom ID: {data.chatroomid} with size {data.member.length}
                </div>
                {data?.member?.map((data, index) => (
                  <div key={index}>Member Socket ID: {data}</div>
                ))}
                <div className="flex mt-5 justify-center items-end">
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.emit("joinchatroom", data.chatroomid);
                        setCurrentchatroom(data.chatroomid);
                        setMode(2);
                      } else {
                        alert("Create Client first");
                      }
                    }}
                    className=" bg-sky-500 px-4 py-2 rounded-xl"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {mode === 2 && (
        <>
          <div className="pt-5  relative ">
            <button
              className="bg-red-500 absolute top-5  px-4 py-2 rounded-xl"
              onClick={() => {
                if (socket) {
                  socket.emit("leaveroom", currentChatroom);
                  setCurrentmessage([]);
                  setMode(1);
                } else {
                  alert("Create Client first");
                }
              }}
            >
              Leave
            </button>

            <h1 className="flex justify-center items-center text-4xl  ">
              Chatroom ID: {currentChatroom}
            </h1>
          </div>
          <form className="flex justify-center mt-5" onSubmit={Createmes}>
            <input
              id="chatmessage"
              className={
                theme
                  ? "px-4 py-2 w-[60%] bg-white bg-opacity-50 "
                  : "px-4 py-2 w-[60%] bg-black bg-opacity-20 "
              }
            />
            <input
              className="hidden"
              id="chatroomid"
              value={currentChatroom}
            ></input>
            <button className="px-4 py-2 bg-pink-400">Send</button>
          </form>
          <h1 className="mt-3 text-2xl flex justify-center">
            Message In Chatroom
          </h1>
          <div className="mt-5 mx-10">
            {currentmessage?.map((data, index) => (
              <div
                className=" bg-opacity-80 bg-green-500 w-auto py-1 px-2"
                key={data}
              >
                <span className="bg-blue-400 px-2 py-1">{data.sender}</span>:{" "}
                {data.newmessage}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
