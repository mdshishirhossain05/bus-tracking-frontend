"use client";

import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/config/env";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket/socket-events";

/**
 * Application socket type. Sharing this alias keeps every consumer — and a
 * future Expo client — bound to the same typed event contract.
 */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(accessToken?: string): AppSocket {
  if (socket) return socket;

  socket = io(env.NEXT_PUBLIC_SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1500,
    auth: accessToken ? { token: accessToken } : undefined,
  }) as AppSocket;

  return socket;
}

export function connectSocket(accessToken?: string): AppSocket {
  const instance = getSocket(accessToken);

  if (accessToken) {
    instance.auth = { token: accessToken };
  }

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}
