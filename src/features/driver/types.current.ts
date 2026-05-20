export type DriverTripStatus = "PLANNED" | "RUNNING" | "ENDED";

export interface DriverTripLiveState {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  speedKmh?: number | null;
  speed?: number | null;
  filteredSpeedKmh?: number | null;
  rawSpeedKmh?: number | null;
  averageSpeedKmh?: number | null;
  rollingAverageSpeedKmh?: number | null;
  displaySpeedKmh?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
  distanceDeltaMeters?: number | null;
  elapsedSeconds?: number | null;
  recordedAt?: string | null;
  updatedAt?: string | null;
  source?: string | null;
  sourceType?: "DRIVER_MOBILE" | "GPS_DEVICE" | null;
  sourceStatus?: "HEALTHY" | "STALE" | "UNHEALTHY" | "DISCONNECTED" | null;
  selectionReason?:
    | "DRIVER_ONLY"
    | "GPS_ONLY"
    | "GPS_PRIORITY"
    | "DRIVER_PRIORITY"
    | "GPS_FALLBACK_TO_DRIVER"
    | "DRIVER_FALLBACK_TO_GPS"
    | "MOST_RECENT_HEALTHY"
    | "NO_HEALTHY_SOURCE"
    | null;
  isStale?: boolean;
}

export interface DriverTripEta {
  etaMinutes: number | null;
  nextStopName: string | null;
  nextStopDistanceMeters?: number | null;
  nearestStopName?: string | null;
  nearestStopDistanceMeters?: number | null;
  usedSpeedKmh?: number | null;
  rollingAverageSpeedKmh?: number | null;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | null;
  finalStopReached?: boolean;
  updatedAt?: string | null;
}

export interface DriverCurrentTrip {
  tripId: string | null;
  isPlanned: boolean;
  canStart: boolean;
  routeId: string;
  routeName: string;
  busId: string;
  busLabel: string;
  driverId: string;
  driverName: string;
  status: DriverTripStatus;
  startedAt: string | null;
  endedAt: string | null;
  serviceScheduleId: string | null;
  departureTime: string | null;
  /** The source the driver explicitly picked on start, if any. */
  preferredTrackingSourceType?: "DRIVER_MOBILE" | "GPS_DEVICE" | null;
  /** Whether the bus has an active GPS-device assignment. Drives the
   *  source picker UI on the driver screen. */
  busHasActiveGpsDevice?: boolean;
  liveState: DriverTripLiveState | null;
  eta: DriverTripEta | null;
}
