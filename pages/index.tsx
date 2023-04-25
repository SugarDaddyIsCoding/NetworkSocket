import Image from "next/image";

import io from "socket.io-client";
import { useState, useEffect } from "react";
import { SocketEvents } from "@/types/events";

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
  const [typingUsers, setTypingUsers] = useState<string>("");
  const [meName, setMeName] = useState<string | null>(null);

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch("/api/socket");

    console.log(g);

    socket = io();
    //everytime server send new data, all the client update state
    socket.on(SocketEvents.UpdateRoomsAndUsers, (num) => {
      console.log("uso janai", num);
      console.log(num.clients.length);
      setOnlineUser(num.clients);
      setOnlineChat(num.chatroom);
    });

    socket.on(SocketEvents.BroadCastMessage, (tosend) => {
      console.log("incoming", tosend);

      setCurrentmessage((prevMessages) => [...prevMessages, tosend]);
    });

    socket.on(SocketEvents.UpdateTypingUsers, ({ typingUsers }) => {
      setTypingUsers(
        typingUsers
          .filter((u) => u[0] !== socket.id)
          .map((u) => u[1])
          .toString()
      );
    });
  };

  const Createuser = async (event) => {
    event.preventDefault();
    await socketInitializer(); //init new user everytime u click create username button
    const newusername = event.target.setusername.value;
    console.log(newusername);
    socket.emit(SocketEvents.SetUserName, newusername);
    setMode(1);
    setMeName(newusername);
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
      socket.emit(SocketEvents.SendMessage, messagedata);
    } else {
      console.log("no socket");
    }
    event.target.chatmessage.value = "";
  };

  return (
    <>
      {meName && <h1 className="text-white">Welcome {meName}</h1>}
      {mode === 0 && (
        <div className="flex items-center justify-center w-screen h-screen">
          <div>
            <h1 className="text-white text-4xl mb-5 flex justify-center items-center">
              I want it that way{" "}
            </h1>
            <form onSubmit={Createuser}>
              <label className="text-white">Set Nickname</label>
              <input
                id="setusername"
                className="border-red-300 py-2 px-4 bg-slate-100 rounded m-3"
              ></input>
              <button className="px-4 border-red-500 bg-blue-200  py-2">
                GO
              </button>
            </form>
          </div>
        </div>
      )}
      {mode === 1 && (
        <div className="m-5 ">
          <h1 className="text-4xl flex justify-center text-white">
            Currently Online User: {onlineUser?.length}
          </h1>
          <div className="bg-white bg-opacity-30 mt-5 py-5 rounded-lg">
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
                  socket.emit(SocketEvents.CreateChatroom, (response) => {
                    setCurrentchatroom(response.socketid);
                    setMode(2);
                  });
                } else {
                  alert("Create Client first");
                }
              }}
              className="px-4 rounded-xl border-red-500 bg-blue-200  py-2"
            >
              Create and join chatroom
            </button>
          </div>
          <h1 className="text-white text-2xl justify-center flex">
            List Of Available Chatroom
          </h1>
          <div className="grid mt-5 grid-cols-3 gap-5">
            {onlineChat?.map((data, index) => (
              <div
                className="bg-violet-900 bg-opacity-60 p-5 rounded-xl text-white"
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
                        socket.emit(SocketEvents.JoinChatroom, data.chatroomid);
                        setCurrentchatroom(data.chatroomid);
                        setMode(2);
                      } else {
                        alert("Create Client first");
                      }
                    }}
                    className=" bg-sky-800 px-4 py-2 rounded-xl"
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
          <div className="mt-5  relative  text-white">
            <button
              className="bg-red-900 absolute top-0  px-4 py-2 rounded-xl"
              onClick={() => {
                if (socket) {
                  socket.emit(SocketEvents.LeaveRoom, currentChatroom);
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
          <form
            className="flex flex-col w-full items-center mt-5 h-20 "
            onSubmit={Createmes}
          >
            <div id="textbox-wrapper" className=" flex justify-center w-[60%]">
              <input
                id="chatmessage"
                className="px-4 py-2 w-full bg-white bg-opacity-70 "
                onChange={() => {
                  socket.emit(SocketEvents.Typing);
                }}
              />
              <input
                className="hidden"
                id="chatroomid"
                value={currentChatroom}
              ></input>
              <button className="px-4 py-2 bg-pink-200">Send</button>
            </div>
            <div id="is-typing-wrapper" className="w-[60%]">
              {typingUsers !== "" && (
                <p className="text-white">
                  {typingUsers} is typing ...
                </p>
              )}
            </div>
          </form>
          <h1 className="text-white mt-3 text-2xl flex justify-center">
            Message In Chatroom
          </h1>
          <div className="mt-5">
            {currentmessage?.map((data, index) => (
              <div
                className="bg-white bg-opacity-80 w-auto py-1 px-2"
                key={data}
              >
                {data.sender}: {data.newmessage}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
