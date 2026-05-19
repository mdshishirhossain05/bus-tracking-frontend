export const SOCKET_EVENTS = {
  CONNECTED: "connected",
  AUTH_ERROR: "auth_error",
  JOIN_TRIP: "join_trip",
  TRIP_JOINED: "trip:joined",
  JOIN_DENIED: "join_denied",
  LEAVE_TRIP: "leave_trip",
  LEFT_TRIP: "left_trip",
  DRIVER_LOCATION: "driver:location",
  TRIP_LOCATION_UPDATED: "trip:location_updated",
  TRIP_ETA_UPDATED: "trip:eta_updated",
  TRIP_STOP_ARRIVAL: "trip:stop_arrival",
  TRIP_STARTED: "trip:started",
  TRIP_ENDED: "trip:ended",
  NOTIFICATION: "notification",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/** Payload a client sends when (un)subscribing to a trip room. */
export interface TripRoomPayload {
  tripId: string;
}

/** GPS fix the driver streams over the realtime `driver:location` channel. */
export interface DriverLocationSocketPayload {
  tripId: string;
  location: {
    lat: number;
    lng: number;
    speedKmh?: number;
    heading?: number;
    accuracyM?: number;
    recordedAt?: string;
  };
}

/**
 * Server acknowledgement for a `driver:location` emit. On success `data`
 * carries the same authoritative payload the HTTP fallback returns.
 */
export type DriverLocationAck =
  | { ok: true; data: unknown }
  | { ok: false; code: string; message: string; details?: unknown };

/**
 * Events a client emits to the server. socket.io enforces these payload
 * shapes at every emit site once the socket is typed with AppSocket.
 */
export interface ClientToServerEvents {
  join_trip: (payload: TripRoomPayload) => void;
  leave_trip: (payload: TripRoomPayload) => void;
  "driver:location": (
    payload: DriverLocationSocketPayload,
    ack: (response: DriverLocationAck) => void,
  ) => void;
}

/**
 * Events the server broadcasts to clients. These payloads cross an untrusted
 * network boundary, so they are intentionally typed as `unknown` — every
 * consumer must normalize/validate the payload before using it.
 */
export interface ServerToClientEvents {
  connected: (payload: unknown) => void;
  auth_error: (payload: unknown) => void;
  "trip:joined": (payload: unknown) => void;
  join_denied: (payload: unknown) => void;
  left_trip: (payload: unknown) => void;
  "trip:location_updated": (payload: unknown) => void;
  "trip:eta_updated": (payload: unknown) => void;
  "trip:stop_arrival": (payload: unknown) => void;
  "trip:started": (payload: unknown) => void;
  "trip:ended": (payload: unknown) => void;
  notification: (payload: unknown) => void;
}
