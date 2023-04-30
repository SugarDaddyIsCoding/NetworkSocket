import Image from "next/image";

import io from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import { SocketEvents } from "@/types/events";
import { Button, Form, Modal } from "react-bootstrap";
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import { runCleanup } from "./api/socket";
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

  const [onlineUser, setOnlineUser] = useState(new Array());
  const [onlineChat, setOnlineChat] = useState();
  const [mode, setMode] = useState(0);
  const [currentChatroom, setCurrentchatroom] = useState();
  const [currentRoomName, setCurrentRoomname] = useState("");
  const [currentmessage, setCurrentmessage] = useState([]);
  const [typingUsers, setTypingUsers] = useState<string>("");
  const [meName, setMeName] = useState<string | null>(null);
  const [theme, setTheme] = useState(true); //true = dark mode

  // states and hook for a create-and-join-room modal
  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false);
    setAbdulModal(false);
  };
  const handleShow = () => setShow(true);
  const [anim, setAnim] = useState(false);
  const roomNameInputRef = useRef<HTMLInputElement>(null);

  // states for chat-with-abdul
  const [isAbdulModal, setAbdulModal] = useState(false);
  const [isAbdulChatRoom, setAbdulChatRoom] = useState(false);

  //states for direct message
  const [isDirect, setDirect] = useState(false);
  const [isDirectChatRoom, setDirectChatRoom] = useState(false);

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

    socket.on(SocketEvents.ReceiveDirect, ({ isDirect }) => {
      //console.log(isDirect);
      setDirect(isDirect);
    });
  };

  const getrandomRoomName = (): string => {
    const customConfig: Config = {
      dictionaries: [adjectives, colors, animals],
      separator: "-",
      style: "capital",
      length: 3,
    };

    const shortName: string = uniqueNamesGenerator(customConfig); // big-donkey
    return shortName;
  };

  const handleCreateAndJoinRoom = async (event) => {
    event.preventDefault();
    const roomName =
      event.target.chatroomNameInput.value === ""
        ? getrandomRoomName()
        : event.target.chatroomNameInput.value;
    console.log(roomName);
    if (socket) {
      socket.emit(
        SocketEvents.CreateChatroom,
        { roomName, isAbdul: isAbdulModal },
        (response) => {
          setCurrentchatroom(response.socketid);
          setCurrentRoomname(response.roomName);
          setAbdulChatRoom(isAbdulModal);
          setMode(2);
          setShow(false);
        }
      );
    } else {
      alert("create client first");
      setMode(0);
    }
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

  const handleDirectMessage = async (event) => {
    event.preventDefault();
    const ReceiverID = event.target.direct.value;
    const SenderName = meName;
    if (socket) {
      socket.emit(
        SocketEvents.DirectMessage,
        { SenderName, ReceiverID, isDirect },
        (response) => {
          setCurrentchatroom(response.socketid);
          if (meName == response.SenderName)
            setCurrentRoomname(response.ReceiverID);
          else setCurrentRoomname(response.SenderName);
          setDirectChatRoom(isDirect);
          setMode(2);
          setShow(false);
        }
      );
    }
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

          {/* create and join room modal */}
          {show && (
            <div
              id="modal"
              className={
                anim
                  ? "animate-wiggle relative z-10 duration-200 transition-all"
                  : "relative z-10 duration-200 transition-all"
              }
              aria-labelledby="modal-title"
              role="dialog"
              aria-modal="true"
              onAnimationEnd={() => {
                if (roomNameInputRef != null && roomNameInputRef.current)
                  roomNameInputRef.current.focus();
                setAnim(false);
              }}
            >
              <form
                id="chatroomname-form"
                onSubmit={
                  !isDirect ? handleCreateAndJoinRoom : handleDirectMessage
                }
              >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                  <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                      <div className="bg-pink-500 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg
                              viewBox="0 0 100 100"
                              width="100%"
                              height="100%"
                              style={{ overflow: "visible" }}
                            >
                              <circle cx="50" cy="50" r="50" fill="transparent">
                                <animate
                                  attributeName="fill"
                                  from="transparent"
                                  to="#ffc10714"
                                  dur="1s"
                                  begin="0s"
                                  repeatCount="1"
                                  fill="freeze"
                                />
                              </circle>

                              <g>
                                <line
                                  x1="0"
                                  y1="50"
                                  x2="100"
                                  y2="50"
                                  stroke="#795548ad"
                                  strokeOpacity="0"
                                  strokeDasharray="4"
                                >
                                  <animate
                                    attributeName="stroke-opacity"
                                    to="0.8"
                                    dur="2s"
                                    begin="0s"
                                    repeatCount="1"
                                    fill="freeze"
                                  />
                                </line>

                                <circle cx="100" cy="50" r="3" fill="green">
                                  <animate
                                    attributeName="cx"
                                    dur="6s"
                                    begin="2s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="100;0;100"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                  <animate
                                    attributeName="cy"
                                    dur="6s"
                                    begin="2s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="50;50;50"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                </circle>
                              </g>

                              <g>
                                <line
                                  x1="50"
                                  y1="0"
                                  x2="50"
                                  y2="100"
                                  stroke="#795548ad"
                                  strokeOpacity="0"
                                  strokeDasharray="4"
                                >
                                  <animate
                                    attributeName="stroke-opacity"
                                    to="0.8"
                                    dur="2s"
                                    begin="0s"
                                    repeatCount="1"
                                    fill="freeze"
                                  />
                                </line>

                                <circle cx="50" cy="100" r="3" fill="red">
                                  <animate
                                    attributeName="cx"
                                    dur="6s"
                                    begin="6.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="50;50;50"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                  <animate
                                    attributeName="cy"
                                    dur="6s"
                                    begin="6.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="100;0;100"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                </circle>
                              </g>

                              <g id="135deg">
                                <line
                                  x1="14.64"
                                  y1="14.64"
                                  x2="85.35"
                                  y2="85.35"
                                  stroke="#795548ad"
                                  strokeOpacity="0"
                                  strokeDasharray="4"
                                >
                                  <animate
                                    attributeName="stroke-opacity"
                                    to="0.8"
                                    dur="2s"
                                    begin="0s"
                                    repeatCount="1"
                                    fill="freeze"
                                  />
                                </line>

                                <circle cx="85.35" cy="85.35" r="3" fill="blue">
                                  <animate
                                    attributeName="cx"
                                    dur="6s"
                                    begin="7.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="85.35;14.64;85.35"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                  <animate
                                    attributeName="cy"
                                    dur="6s"
                                    begin="7.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="85.35;14.64;85.35"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                </circle>
                              </g>

                              <g id="45deg">
                                <line
                                  x1="85.35"
                                  y1="14.64"
                                  x2="14.64"
                                  y2="85.35"
                                  stroke="#795548ad"
                                  strokeOpacity="0"
                                  strokeDasharray="4"
                                >
                                  <animate
                                    attributeName="stroke-opacity"
                                    to="0.8"
                                    dur="2s"
                                    begin="0s"
                                    repeatCount="1"
                                    fill="freeze"
                                  />
                                </line>

                                <circle
                                  cx="85.35"
                                  cy="14.64"
                                  r="3"
                                  fill="orange"
                                >
                                  <animate
                                    attributeName="cx"
                                    dur="6s"
                                    begin="8.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="85.35;14.64;85.35"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                  <animate
                                    attributeName="cy"
                                    dur="6s"
                                    begin="8.5s"
                                    calcMode="spline"
                                    repeatCount="indefinite"
                                    values="14.64;85.35;14.64"
                                    keyTimes="0;0.5;1"
                                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                                  />
                                </circle>
                              </g>
                            </svg>
                          </div>
                          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-grow">
                            <h3
                              className="text-base font-bold leading-6 text-gray-900 text-lg"
                              id="modal-title"
                            >
                              {isAbdulModal
                                ? "New Abdul Chatroom"
                                : isDirect
                                ? "Select who you want to talk to"
                                : "New Chatroom"}
                            </h3>
                            <p>{"<"}-cr: codepen.io/maremarismaria</p>

                            <div className="mt-8 mb-4">
                              <div className="mb-4">
                                {!isDirect && (
                                  <input
                                    className="focus:ring-2 focus:ring-yellow-400 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="chatroomNameInput"
                                    type="text"
                                    placeholder="room name"
                                    ref={roomNameInputRef}
                                  ></input>
                                )}
                                {isDirect && (
                                  <select className="text-black" id="direct">
                                    <option selected>Select User</option>
                                    {onlineUser?.map((data, index) => (
                                      <option key={index} value={data.id}>
                                        <span className="bg-yellow-200">
                                          {data.username}
                                        </span>
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                          type="submit"
                          className="hover:scale-105 inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 sm:ml-3 sm:w-auto"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          className="hover:underline duration-500 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
          {/* end of create chatroom modal */}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setAnim(true);
                handleShow();
                setDirect(false);
              }}
              className="px-4 rounded-xl border-red-500 bg-blue-600  py-2"
            >
              Create and join chatroom
            </button>
            <button
              onClick={() => {
                setAnim(true);
                setAbdulModal(true);
                setDirect(false);
                handleShow();
              }}
              className="px-4 rounded-xl border-red-500 bg-blue-600  py-2"
            >
              Chat with Abdul
            </button>
            <button
              onClick={() => {
                setAnim(true);
                setDirect(true);
                handleShow();
              }}
              className="px-4 rounded-xl boder-red-500 bg-blue-600 py-2"
            >
              Direct Message
            </button>
          </div>
          <h1 className=" text-2xl justify-center flex">
            List Of Available Chatroom
          </h1>
          <div className="grid mt-5 grid-cols-3 gap-5">
            {onlineChat?.map((data, index) => {
              //console.log(onlineUser.filter((u) => u.id === data.ReceiverID)[0])
              return (
                <div
                  className="bg-violet-500 bg-opacity-60 p-5 rounded-xl"
                  key={index}
                >
                  {isDirect && (
                    <div className="font-medium italic p-3 mb-3 bg-red-400 text-emerald-900 text-3xl">
                      Message From :
                      {meName === data.SenderName
                        ? onlineUser.filter((u) => u.id === data.ReceiverID)[0]
                            .username
                        : (data.roomName || false)? data.roomName: data.SenderName}
                    </div>
                  )}
                  {!isDirect && (
                    <div className="font-medium italic p-3 mb-3 bg-red-400 text-emerald-900 text-3xl">
                      Room Name :{data.roomName}
                    </div>
                  )}
                  <div>
                    Chatroom ID: {data.chatroomid} with size{" "}
                    {data.member.length}
                  </div>
                  <div className="flex mt-5 justify-center items-end">
                    {
                      (meName ===
                        onlineUser.filter((u) => u.id === data.ReceiverID)[0]?
                          .username ||
                        meName === data.SenderName) && (
                        <button
                          onClick={() => {
                            if (socket) {
                              socket.emit(
                                SocketEvents.JoinChatroom,
                                data.chatroomid,
                                !!isDirect
                              );
                              setCurrentchatroom(data.chatroomid);
                              setCurrentRoomname(data.roomName);
                              setMode(2);
                            } else {
                              alert("create client first");
                              setMode(0);
                            }
                          }}
                          className=" bg-sky-500 px-4 py-2 rounded-xl"
                        >
                          Accept
                        </button>
                      )}
                    {!data.isDirect && (
                      <button
                        onClick={() => {
                          if (socket) {
                            socket.emit(
                              SocketEvents.JoinChatroom,
                              data.chatroomid,
                              !!isAbdulModal
                            );
                            setCurrentchatroom(data.chatroomid);
                            setCurrentRoomname(data.roomName);
                            setAbdulChatRoom(data.isAbdul);
                            setMode(2);
                          } else {
                            alert("create client first");
                            setMode(0);
                          }
                        }}
                        className=" bg-sky-500 px-4 py-2 rounded-xl"
                      >
                        Join
                      </button>
                    )}
                  </div>
                  {data?.member?.map((data, index) => (
                    <div key={index}>Member Socket ID: {data}</div>
                  ))}
                </div>
              );
              /*else
                return (
                  <div
                    className="bg-violet-500 bg-opacity-60 p-5 rounded-xl"
                    key={index}
                  >
                    <div className="font-medium italic p-3 mb-3 bg-red-400 text-emerald-900 text-3xl">
                      Room Name : {data.roomName}
                    </div>
                    <div>
                      Chatroom ID: {data.chatroomid} with size{" "}
                      {data.member.length}
                    </div>
                    <div className="flex mt-5 justify-center items-end">
                      <button
                        onClick={() => {
                          if (socket) {
                            socket.emit(
                              SocketEvents.JoinChatroom,
                              data.chatroomid,
                              !!isAbdulModal
                            );
                            setCurrentchatroom(data.chatroomid);
                            setCurrentRoomname(data.roomName);
                            setAbdulChatRoom(data.isAbdul);
                            setMode(2);
                          } else {
                            alert("create client first");
                            setMode(0);
                          }
                        }}
                        className=" bg-sky-500 px-4 py-2 rounded-xl"
                      >
                        Join
                      </button>
                    </div>
                    {data?.member?.map((data, index) => (
                      <div key={index}>Member Socket ID: {data}</div>
                    ))}
                  </div>
                );*/
            })}
          </div>
        </div>
      )}
      {mode === 2 && (
        <>
          <h2 className="flex justify-center items-center text-xl text-neutral-100 bg-blue-400">
            Chatroom Name: {currentRoomName}
          </h2>
          {isAbdulChatRoom && <h3 className="text-center">อับดุลเอ้ย</h3>}
          <div className="pt-5  relative ">
            <button
              className="bg-red-500 absolute top-5  px-4 py-2 rounded-xl"
              onClick={() => {
                if (socket) {
                  socket.emit(SocketEvents.LeaveRoom, currentChatroom);
                  setCurrentmessage([]);
                  setMode(1);
                } else {
                  alert("create client first");
                  setMode(0);
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
              onChange={() => {
                socket.emit(SocketEvents.Typing);
              }}
            />
            <input
              className="hidden"
              id="chatroomid"
              value={currentChatroom}
              readOnly
            ></input>
            <button className="px-4 py-2 bg-pink-400">Send</button>
            <div id="is-typing-wrapper" className="w-[60%]">
              {typingUsers !== "" && (
                <h1 className={theme ? "  text-white " : " text-black"}>
                  {typingUsers} is typing ...
                </h1>
              )}
            </div>
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

export async function getServerSideProps() {
  // check if the cleanup loop is already initialized or not
  // so that only 1 user will trigger the cleanup loop
  if (!cleanupInit) {
    cleanupInit = true;
    runCleanup();
  }
  return {
    props: {}, // will be passed to the page component as props
  };
}
