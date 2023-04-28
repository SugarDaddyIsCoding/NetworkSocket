export enum SocketEvents {
    // events emitted from client side
    SetUserName = "SET_USERNAME",
    CreateChatroom = "CREATE_CHATROOM",
    JoinChatroom = "JOIN_CHATROOM",
    LeaveRoom = "LEAVE_ROOM",
    SendMessage = "SEND_MESSAGE",
    Typing = "TYPING",

    // events emitted from socket side
    UpdateRoomsAndUsers = "UPDATE_ROOMS_AND_USERS",
    UpdateTypingUsers = "UPDATE_TYPING_USERS",
    BroadCastMessage = "BROADCAST_MESSAGE",

}