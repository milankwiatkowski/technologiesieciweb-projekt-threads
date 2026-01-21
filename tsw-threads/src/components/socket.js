import { io } from "socket.io-client";

export const socket = io("https://localhost", {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
});