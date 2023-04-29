import { Server, Socket } from "socket.io";

export type onlineChatroomT = Map<
  string,
  { chatroomid: string; member: string[]; roomName: string }
>;
// export type onlineClientsT

declare global {
  // eslint-disable-next-lin no-var
  var startchatroomid: number; //global variable for chatroom id
  var onlineChatroom: onlineChatroomT;
  var onlineClients: any;

  var cleanupInit: boolean; // check if the cleanup loop is already running or not
  var io: Server | undefined;
}

export const startchatroomid = global.startchatroomid;
export const onlineChatroom =
  global.onlineChatroom ||
  new Map<
    string,
    {
      chatroomid: string;
      member: string[];
      roomName: string;
      category: Array<number>;
    }
  >(); //Create a  new map to save a chatroom and all the client in each on
export const onlineClients = global.onlineClients || new Map<any, any>();
export const cleanupInit = global.cleanupInit;
// export const io = global.io || new Server(res.socket.server);

global.startchatroomid = 0;
global.cleanupInit = false;
global.onlineChatroom = onlineChatroom;
global.onlineClients = onlineClients;

export const getNewServerIO = (responseSocketServer?: any) => {
  if (global.io) {
    // console.log("existing io");
    return global.io;
  }
  // console.log("new io");
  global.io = new Server(responseSocketServer);
  return global.io;
};
