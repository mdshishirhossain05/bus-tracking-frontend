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
  TRIP_PRE_OPENED: "trip:pre_opened",
  TRIP_PRE_STATE_CHANGED: "trip:pre_state_changed",
  TRIP_OCCUPANCY_UPDATED: "trip:occupancy_updated",
  NOTIFICATION: "notification",
} as const;

export type OccupancyLevelValue = "LIGHT" | "MODERATE" | "FULL";

export type ServiceAlertSeverityValue = "INFO" | "WARNING" | "CRITICAL";

export type TripPreTripPhase =
  | "AT_DEPOT"
  | "APPROACHING_ORIGIN"
  | "AT_ORIGIN";

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
