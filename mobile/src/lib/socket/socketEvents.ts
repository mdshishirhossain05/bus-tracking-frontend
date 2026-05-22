/**
 * Canonical realtime event names — copied verbatim from the backend so the
 * native client subscribes to exactly the same channels the web client does.
 */
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
