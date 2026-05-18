export type {
  DriverCurrentTrip,
  DriverTripEta,
  DriverTripLiveState,
  DriverTripStatus as TripStatus,
} from "@/features/driver/types.current";

export type DriverTripControlStatus =
  | "idle"
  | "preparing"
  | "starting"
  | "active"
  | "ending"
  | "ended"
  | "error";

export type LocationPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

export type PublishState =
  | "idle"
  | "watching"
  | "recovering"
  | "sending"
  | "success"
  | "error";

export type StartReadinessStage =
  | "idle"
  | "checking"
  | "requesting_permission"
  | "acquiring_fix"
  | "starting_trip";

export type DriverTrackingSourceType = "DRIVER_MOBILE" | "GPS_DEVICE";
export type DriverTrackingSourceStatus =
  | "HEALTHY"
  | "STALE"
  | "UNHEALTHY"
  | "DISCONNECTED";
export type DriverTrackingSelectionReason =
  | "DRIVER_ONLY"
  | "GPS_ONLY"
  | "GPS_PRIORITY"
  | "DRIVER_PRIORITY"
  | "GPS_FALLBACK_TO_DRIVER"
  | "DRIVER_FALLBACK_TO_GPS"
  | "MOST_RECENT_HEALTHY"
  | "NO_HEALTHY_SOURCE";

export interface DriverTrackingSourceSummary {
  sourceType: DriverTrackingSourceType | null;
  sourceStatus: DriverTrackingSourceStatus | null;
  selectionReason: DriverTrackingSelectionReason | null;
  sourceLabel: string | null;
}
