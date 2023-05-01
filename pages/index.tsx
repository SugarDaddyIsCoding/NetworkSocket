import Image from 'next/image'

import io from 'socket.io-client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SocketEvents } from '@/types/events'
import { Button, Form, Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  fa0,
  faBook,
  faBookAtlas,
  faComment,
  faGamepad,
  faGraduationCap,
  faHamburger,
  faLandmark,
} from '@fortawesome/free-solid-svg-icons'
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator'
import { runCleanup } from './api/socket'
import { SORRY } from '@/ไกลๆ/anim'
import { useOpenAI } from '@/hooks/useOpenAI'
import { useInterval } from '@/hooks/useInterval'
import { Abdul } from '@/types/abdul'
import { v4 as uuid } from 'uuid'

let socket

export default function Home() {
  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('rdytodelete', socket.id, () => {
          socket.disconnect(true)
        })
      }
    }
  }, [])

  const [onlineUser, setOnlineUser] = useState()
  const [onlineChat, setOnlineChat] = useState()
  const [mode, setMode] = useState(0)
  const [currentChatroom, setCurrentchatroom] = useState()
  const [currentRoomName, setCurrentRoomname] = useState('')
  const [currentmessage, setCurrentmessage] = useState([])
  const [typingUsers, setTypingUsers] = useState<string>('')
  const [meName, setMeName] = useState<string | null>(null)
  const [theme, setTheme] = useState(true) //true = dark mode
  const [currentCa, setCurrentCa] = useState()

  const [category, setCategory] = useState(Array(4).fill(false))

  // states and hook for a create-and-join-room modal
  const [show, setShow] = useState(false)
  const handleClose = () => {
    setShow(false)
    resetAbdul()
  }
  const handleShow = () => setShow(true)
  const [anim, setAnim] = useState(false)
  const roomNameInputRef = useRef<HTMLInputElement>(null)

  // states for chat-with-abdul
  const [abdul, setAbdul] = useState<Abdul>({
    mIdRef: null,
    rIdRef: null,
    isModal: false,
    isChatRoom: false,
    nameRef: '',
    messages: [],
    message: '',
    response: '',
    messageRef: '',
    responseRef: '',
    cursor: false,
  })

  const resetAbdul = () => {
    setAbdul({
      mIdRef: null,
      rIdRef: null,
      isModal: false,
      isChatRoom: false,
      nameRef: '',
      messages: [],
      message: '',
      response: '',
      messageRef: '',
      responseRef: '',
      cursor: false,
    })
    openai.reset()
  }

  const openai = useOpenAI({ messages: abdul.messages })

  useEffect(() => {
    if (socket) {
      socket.emit(SocketEvents.AbdulResponse, {
        chatRoomId: currentChatroom,
        response: openai.response,
        responseRef: openai.responseRef,
        cursor: openai.cursor,
      })
    }
  }, [socket, openai.response])

  useEffect(() => {
    if (socket && !openai.message && openai.response) {
      console.log('testt')
      socket.emit(SocketEvents.AbdulMessage, {
        mIdRef: uuid(),
        chatRoomId: currentChatroom,
        nameRef: meName || 'test',
        message: openai.message,
        messageRef: openai.messageRef,
      })
    }
  }, [socket, !!openai.message, !!openai.response])

  useEffect(() => {
    if (socket && !abdul.message && abdul.response) {
      setAbdul((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'user',
            name: abdul.nameRef,
            content: abdul.messageRef,
          },
        ],
      }))
      openai.setMessageRef(abdul.messageRef)
    }
  }, [socket, abdul.mIdRef])

  useEffect(() => {
    if (socket && abdul.responseRef) {
      setAbdul((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content: abdul.responseRef,
          },
        ],
      }))
      openai.setResponseRef(abdul.responseRef)
    }
  }, [socket, abdul.responseRef])

  const socketInitializer = async () => {
    // We just call it because we don't need anything else out of it
    const g = await fetch('/api/socket')

    console.log(g)

    socket = io()
    //everytime server send new data, all the client update state
    socket.on(SocketEvents.UpdateRoomsAndUsers, (num) => {
      console.log('uso janai', num)
      console.log(num.clients.length)
      setOnlineUser(num.clients)
      setOnlineChat(num.chatroom)
    })

    socket.on(SocketEvents.BroadCastMessage, (tosend) => {
      console.log('incoming', tosend)

      setCurrentmessage((prevMessages) => [...prevMessages, tosend])
    })

    socket.on(SocketEvents.UpdateTypingUsers, ({ typingUsers }) => {
      setTypingUsers(
        typingUsers
          .filter((u) => u[0] !== socket.id)
          .map((u) => u[1])
          .toString()
      )
    })

    // Abdul
    socket.on(
      SocketEvents.BroadcastAbdulMessage,
      ({ mIdRef, nameRef, message, messageRef }) => {
        console.log('on: BroadcastAbdulMessage')
        setAbdul((prev) => ({
          ...prev,
          mIdRef,
          nameRef,
          message,
          messageRef,
        }))
      }
    )

    // Abdul
    socket.on(
      SocketEvents.BroadcastAbdulResponse,
      ({ rIdRef, response, responseRef, cursor }) => {
        console.log('on: BroadcastAbdulResponse')
        setAbdul((prev) => ({
          ...prev,
          rIdRef,
          response,
          responseRef,
          cursor,
        }))
      }
    )
  }

  const getrandomRoomName = (): string => {
    const customConfig: Config = {
      dictionaries: [adjectives, colors, animals],
      separator: '-',
      style: 'capital',
      length: 3,
    }

    const shortName: string = uniqueNamesGenerator(customConfig) // big-donkey
    return shortName
  }

  const handleCreateAndJoinRoom = async (event) => {
    event.preventDefault()
    const roomName =
      event.target.chatroomNameInput.value === ''
        ? getrandomRoomName()
        : event.target.chatroomNameInput.value
    console.log(roomName)

    const trueIndexes: number[] = []

    category.forEach((val, index) => {
      if (val) {
        trueIndexes.push(index)
      }
    })

    setCategory(new Array(category.length).fill(false))
    console.log(trueIndexes)

    if (socket) {
      socket.emit(
        SocketEvents.CreateChatroom,
        { roomName, isAbdul: abdul.isModal, trueIndexes },
        (response) => {
          setCurrentchatroom(response.socketid)
          setCurrentRoomname(response.roomName)
          setCurrentCa(response.trueIndexes)

          setAbdul((prev) => ({ ...prev, isChatRoom: abdul.isModal }))
          setMode(2)
          setShow(false)
        }
      )
    } else {
      alert('create client first')
      setMode(0)
    }
    resetAbdul()
  }

  const Createuser = async (event) => {
    event.preventDefault()
    await socketInitializer() //init new user everytime u click create username button
    const newusername = event.target.setusername.value
    console.log(newusername)
    socket.emit(SocketEvents.SetUserName, newusername)
    setMode(1)
    setMeName(newusername)
  }

  const handleCategoryClick = (index) => {
    setCategory((prevState) => {
      const newState = [...prevState]
      newState[index] = !newState[index]
      return newState
    })
  }

  const Createmes = async (event) => {
    event.preventDefault()
    const messagedata = {
      newmessage: event.target.chatmessage.value,
      chatroomid: event.target.chatroomid.value,
    }
    console.log(messagedata)
    if (socket) {
      console.log('send!!')
      socket.emit(SocketEvents.SendMessage, messagedata)
    } else {
      console.log('no socket')
    }
    event.target.chatmessage.value = ''
  }

  function getFontAwesomeIcon(index: number, mode: boolean) {
    switch (index) {
      case 0:
        return (
          <div
            className={
              'category-sep bg-purple-500 ' + (mode ? 'w-20 h-16' : 'h-10 w-10')
            }
          >
            <FontAwesomeIcon icon={faGamepad} className='' />
          </div>
        )
      case 1:
        return (
          <div
            className={
              'category-sep bg-sky-500 ' + (mode ? 'w-20 h-16' : 'h-10 w-10')
            }
          >
            <FontAwesomeIcon icon={faBookAtlas} className='' />
          </div>
        )
      case 2:
        return (
          <div
            className={
              'category-sep bg-teal-400 ' + (mode ? 'w-20 h-16' : 'h-10 w-10')
            }
          >
            <FontAwesomeIcon icon={faComment} className='' />
          </div>
        )
      case 3:
        return (
          <div
            className={
              'category-sep bg-red-500 ' + (mode ? 'w-20 h-16' : 'h-10 w-10')
            }
          >
            <FontAwesomeIcon icon={faLandmark} className='' />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className={
        theme
          ? ' bg-slate-950 text-white w-screen min-h-screen relative'
          : ' bg-white text-black w-screen min-h-screen relative'
      }
    >
      <button
        onClick={() => {
          setTheme(!theme)
          console.log(theme)
        }}
        className='px-4 absolute top-2 z-10 right-0 py-2 bg-yellow-400'
      >
        Change Mode
      </button>
      {mode === 0 && (
        <div className='flex pt-5 items-center justify-center '>
          <div>
            <h1 className='text-4xl mb-5 flex justify-center items-center'>
              I want it that way
            </h1>
            <form onSubmit={Createuser}>
              <label className=''>Set Nickname</label>
              <input
                id='setusername'
                className={
                  theme
                    ? 'border-red-300 bg-slate-600 py-2 px-4 rounded m-3'
                    : 'border-red-300 bg-slate-200 py-2 px-4 rounded m-3'
                }
              ></input>
              <button className='px-4 border-red-500 bg-blue-500  py-2'>
                GO
              </button>
            </form>
          </div>
        </div>
      )}
      {mode === 1 && (
        <div className='p-5 '>
          <h1 className='text-4xl flex justify-center '>
            Currently Online User: {onlineUser?.length}
          </h1>
          <div className='bg-slate-300 text-black bg-opacity-30 mt-5 py-5 rounded-lg'>
            {onlineUser?.map((data, index) => (
              <div key={index}>
                <span className='bg-red-200'>Socket ID:{data.id}</span>
                <span className='bg-yellow-200'>Username: {data.username}</span>
                {data?.joinedroom?.map((data, index) => (
                  <div key={index}>Chatroom ID: {data}</div>
                ))}
              </div>
            ))}
          </div>

          {/* create and join room modal */}
          {show && (
            <div
              id='modal'
              className={
                anim
                  ? 'animate-wiggle relative z-10 duration-200 transition-all'
                  : 'relative z-10 duration-200 transition-all'
              }
              aria-labelledby='modal-title'
              role='dialog'
              aria-modal='true'
              onAnimationEnd={() => {
                if (roomNameInputRef != null && roomNameInputRef.current)
                  roomNameInputRef.current.focus()
                setAnim(false)
              }}
            >
              <form id='chatroomname-form' onSubmit={handleCreateAndJoinRoom}>
                <div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'></div>

                <div className='fixed inset-0 z-10 overflow-y-auto'>
                  <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                    <div className='relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg'>
                      <div className='bg-pink-500 px-4 pb-4 pt-5 sm:p-6 sm:pb-4'>
                        <div className='sm:flex sm:items-start'>
                          <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                            <SORRY />
                          </div>
                          <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-grow'>
                            <h3
                              className='text-base font-bold leading-6 text-gray-900 text-lg'
                              id='modal-title'
                            >
                              {!abdul.isModal
                                ? 'New a chat room'
                                : 'New Abdul Chatroom'}
                            </h3>
                            <p>{'<'}-cr: codepen.io/maremarismaria</p>

                            <div className='mt-8 mb-4'>
                              <div className='mb-4'>
                                <input
                                  className='focus:ring-2 focus:ring-yellow-400 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                  id='chatroomNameInput'
                                  type='text'
                                  placeholder='room name'
                                  ref={roomNameInputRef}
                                ></input>
                              </div>
                            </div>
                            <div className='flex justify-between text-sm  mr-5'>
                              <div
                                className={
                                  ' category-sep w-20 h-16 ' +
                                  (category[0] ? 'bg-purple-500 scale-105' : '')
                                }
                                onClick={() => handleCategoryClick(0)}
                              >
                                {' '}
                                <FontAwesomeIcon icon={faGamepad} size='xl' />
                                <div>Gaming</div>
                              </div>
                              <div
                                className={
                                  ' category-sep w-20 h-16 ' +
                                  (category[1] ? 'bg-sky-500 scale-105' : '')
                                }
                                onClick={() => handleCategoryClick(1)}
                              >
                                {' '}
                                <FontAwesomeIcon icon={faBookAtlas} size='xl' />
                                <div>Studying</div>
                              </div>
                              <div
                                className={
                                  ' category-sep w-20 h-16 ' +
                                  (category[2] ? 'bg-teal-400 scale-105' : '')
                                }
                                onClick={() => handleCategoryClick(2)}
                              >
                                <FontAwesomeIcon icon={faComment} size='xl' />
                                <div>Chilling</div>
                              </div>
                              <div
                                className={
                                  ' category-sep w-20 h-16 ' +
                                  (category[3] ? 'bg-red-500 scale-105' : '')
                                }
                                onClick={() => handleCategoryClick(3)}
                              >
                                <FontAwesomeIcon icon={faLandmark} size='xl' />
                                <div>Politic</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
                        <button
                          type='submit'
                          className='hover:scale-105 inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 sm:ml-3 sm:w-auto'
                        >
                          Create
                        </button>
                        <button
                          type='button'
                          className='hover:underline duration-500 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
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

          <div className='flex gap-4'>
            <button
              onClick={() => {
                setAnim(true)
                handleShow()
              }}
              className='px-4 rounded-xl border-red-500 bg-blue-600  py-2'
            >
              Create and join chatroom
            </button>
            <button
              onClick={() => {
                setAnim(true)
                setAbdul((prev) => ({ ...prev, isModal: true }))
                handleShow()
              }}
              className='px-4 rounded-xl border-red-500 bg-blue-600  py-2'
            >
              Chat with Abdul
            </button>
          </div>
          <h1 className=' text-2xl justify-center flex'>
            List Of Available Chatroom
          </h1>
          <div className='grid mt-5 grid-cols-3 gap-5'>
            {onlineChat?.map((data, index) => (
              <div
                className='bg-violet-500 bg-opacity-60 p-5 rounded-xl'
                key={index}
              >
                <div className='font-medium italic p-3 mb-3 bg-red-400 text-emerald-900 text-3xl'>
                  Room Name : {data.roomName}
                </div>
                <div>
                  Chatroom ID: {data.chatroomid} with size {data.member.length}
                </div>
                <div className='flex mt-2 items-center justify-start  flex-row'>
                  Topic:
                  {data.category?.map((data) => (
                    <div className='px-2' key={data}>
                      {' '}
                      {getFontAwesomeIcon(data, false)}
                    </div>
                  ))}
                </div>

                <div className='flex mt-5 justify-center items-end'>
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.emit(
                          SocketEvents.JoinChatroom,
                          data.chatroomid,
                          data.isAbdul
                        )
                        setCurrentchatroom(data.chatroomid)
                        setCurrentRoomname(data.roomName)
                        setAbdul((prev) => ({
                          ...prev,
                          isChatRoom: data.isAbdul,
                        }))
                        setCurrentCa(data.category)
                        setMode(2)
                      } else {
                        alert('create client first')
                        setMode(0)
                      }
                    }}
                    className=' bg-sky-500 px-4 py-2 rounded-xl'
                  >
                    Join
                  </button>
                </div>
                {data?.member?.map((data, index) => (
                  <div key={index}>Member Socket ID: {data}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {mode === 2 && (
        <>
          <h2 className='flex justify-center items-center text-xl text-neutral-100 bg-blue-400'>
            Chatroom Name: {currentRoomName}
          </h2>
          {abdul.isChatRoom && <h3 className='text-center'>อับดุลเอ้ย</h3>}
          <div className='pt-5  relative '>
            {/* #LEAVE BUTTON */}
            <button
              className='bg-red-500 absolute top-5  px-4 py-2 rounded-xl'
              onClick={() => {
                if (socket) {
                  socket.emit(SocketEvents.LeaveRoom, currentChatroom)
                  resetAbdul()
                  setCurrentmessage([])
                  setMode(1)
                } else {
                  alert('create client first')
                  setMode(0)
                }
              }}
            >
              Leave
            </button>
            {/* #CHATROOM ID */}
            <h1 className='flex justify-center items-center text-4xl  '>
              Chatroom ID: {currentChatroom}
              <div className='flex flex-row text-4xl ml-10 items-center'>
                {currentCa?.map((data) => {
                  return (
                    <div className='px-2 ' key={data}>
                      {' '}
                      {getFontAwesomeIcon(data, true)}
                    </div>
                  )
                })}
              </div>
            </h1>
          </div>
          {/* #MESSAGE BAR */}
          {!abdul.isChatRoom ? (
            <>
              <form className='flex justify-center mt-5' onSubmit={Createmes}>
                <input
                  id='chatmessage'
                  className={
                    theme
                      ? 'px-4 py-2 w-[60%] bg-white bg-opacity-50 '
                      : 'px-4 py-2 w-[60%] bg-black bg-opacity-20 '
                  }
                  onChange={(event) => {
                    socket.emit(SocketEvents.Typing)
                  }}
                />
                <input
                  className='hidden'
                  id='chatroomid'
                  value={currentChatroom}
                  readOnly
                ></input>
                <button className='px-4 py-2 bg-pink-400'>Send</button>
                {/* #IS TYPING */}
                <div id='is-typing-wrapper' className='w-[60%] min-h-[40px]'>
                  {typingUsers !== '' && (
                    <h1 className={theme ? '  text-white ' : ' text-black'}>
                      {typingUsers} is typing ...
                    </h1>
                  )}
                </div>
              </form>
              <h1 className='mt-3 text-2xl flex justify-center'>
                Message In Chatroom
              </h1>
              <div className='mt-5 mx-10'>
                {currentmessage?.map((data, index) => (
                  <div
                    className=' bg-opacity-80 bg-green-500 w-auto py-1 px-2'
                    key={`${socket?.id}-${index}`}
                  >
                    <span className='bg-blue-400 px-2 py-1'>{data.sender}</span>
                    : {data.newmessage}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // FOR ABDUL HERE
            <>
              <form
                className='flex justify-center mt-5'
                onSubmit={(event) => {
                  event.preventDefault()
                  if (socket && openai.message && !abdul.response) {
                    // Createmes(event)
                    console.log('submit form', {
                      chatRoomId: currentChatroom,
                      message: openai.message,
                      messageRef: openai.messageRef,
                    })
                    // socket.emit(SocketEvents.AbdulMessage, {
                    //   chatRoomId: currentChatroom,
                    //   message: openai.message,
                    //   messageRef: openai.messageRef,
                    // })
                    openai.handleSubmit(event)
                  }
                }}
              >
                <div className='w-full flex justify-center'>
                  <input
                    id='chatmessage'
                    value={openai.message}
                    className={
                      theme
                        ? 'px-4 py-2 w-[50%] bg-white bg-opacity-50 '
                        : 'px-4 py-2 w-[50%] bg-black bg-opacity-20 '
                    }
                    onChange={(event) => {
                      // console.log('as')
                      openai.setError(false)
                      openai.handleChange(event)
                      if (socket) {
                        socket.emit(SocketEvents.Typing)
                      }
                    }}
                  />
                  <input
                    className='hidden'
                    id='chatroomid'
                    value={currentChatroom}
                    readOnly
                  ></input>
                  <button
                    type='submit'
                    className='px-4 py-2 bg-pink-400'
                    disabled={!!abdul.response || !openai.message}
                  >
                    Send
                  </button>
                </div>
                {/* #IS TYPING */}
              </form>
              <div
                id='is-typing-wrapper'
                className='w-full flex-center flex-col'
              >
                {openai.isError && (
                  <h1 className='text-red-500 min-h-[20px]'>
                    ERROR: too many requests
                  </h1>
                )}
                <h1
                  className={
                    theme
                      ? '  text-white min-h-[20px]'
                      : ' text-black  min-h-[20px]'
                  }
                >
                  {typingUsers !== '' && `${typingUsers} is typing ...`}
                </h1>
              </div>
              <h1 className='mt-3 text-2xl flex justify-center'>
                Message In Chatroom
              </h1>
              <div className='mt-5 mx-10'>
                <div
                  className='flex flex-col gap-1 bg-opacity-80 bg-green-500 w-auto'
                  style={{
                    padding:
                      abdul.messages.length === 0
                        ? '0 8px 0 8px'
                        : '4px 8px 4px 8px',
                  }}
                >
                  {abdul.messages?.map((message, idx) => (
                    <div key={`${socket?.id}-${idx}`}>
                      <span className='bg-blue-400 px-2 h-full'>
                        {message.role === 'user' ? message.name : 'Abdul'}
                      </span>
                      <span>: {message.content}</span>
                    </div>
                  ))}
                  {abdul.response && (
                    <div>
                      <span className='bg-blue-400 px-2 h-full'>Abdul</span>
                      <span>
                        : {abdul.response}
                        {abdul.cursor && '▋'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export async function getServerSideProps() {
  // check if the cleanup loop is already initialized or not
  // so that only 1 user will trigger the cleanup loop
  if (!cleanupInit) {
    cleanupInit = true
    runCleanup()
  }
  return {
    props: {}, // will be passed to the page component as props
  }
}
