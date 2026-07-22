import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "./api";

// Socket.IO now only carries run output and save notifications. The document,
// language, cursors and presence travel over the Yjs connection instead.
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
