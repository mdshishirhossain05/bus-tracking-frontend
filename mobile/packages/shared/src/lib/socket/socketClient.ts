import { io, type Socket } from "socket.io-client";
import { env } from "../../config/env";
import { getAccessToken } from "../auth/tokenStore";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(env.socketUrl, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    // A function auth re-reads the latest token on every (re)connect, so a
    // token refreshed mid-session is picked up automatically on reconnect.
    auth: (cb: (data: Record<string, unknown>) => void) => {
      const token = getAccessToken();
      cb(token ? { token } : {});
    },
  });

  return socket;
}

export function connectSocket(): Socket {
  const instance = getSocket();
  if (!instance.connected) instance.connect();
  return instance;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
