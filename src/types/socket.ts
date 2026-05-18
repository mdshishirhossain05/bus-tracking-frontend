export interface TripJoinedPayload {
  tripId: string;
}

export interface TripLocationUpdatedPayload {
  tripId: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
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
  source?: string | null;
  recordedAt: string;
  updatedAt?: string | null;
}

export interface TripEtaUpdatedPayload {
  tripId: string;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  updatedAt?: string | null;
  eta: {
    etaMinutes?: number | null;
    nextStopName?: string | null;
    nextStopDistanceMeters?: number | null;
    nearestStopName?: string | null;
    nearestStopDistanceMeters?: number | null;
    usedSpeedKmh?: number | null;
    rollingAverageSpeedKmh?: number | null;
    confidence?: "HIGH" | "MEDIUM" | "LOW" | null;
    finalStopReached?: boolean;
    nearestStop?: {
      stopId?: string | null;
      stopName?: string | null;
      stopOrder?: number | null;
      distanceMeters?: number | null;
    } | null;
    nextStop?: {
      stopId?: string | null;
      stopName?: string | null;
      stopOrder?: number | null;
      distanceMeters?: number | null;
    } | null;
    stopArrival?: unknown;
  } | null;
}

export interface TripStopArrivalPayload {
  tripId: string;
  routeId?: string | null;
  busId?: string | null;
  driverId?: string | null;
  stopId: string;
  stopName: string;
  stopOrder: number;
  arrivalTime: string;
  recordedAt: string;
  distanceMeters: number;
  dayType: string;
  scheduledTime: string | null;
  scheduledDateUtc: string | null;
  delayMinutes: number;
  status: "NO_SCHEDULE" | "LATE" | "EARLY" | "ON_TIME" | string;
}

export interface TripStartedPayload {
  tripId: string;
  routeId?: string | null;
  busId?: string | null;
  driverId?: string | null;
  status?: string | null;
  startedAt?: string | null;
}

export interface TripEndedPayload {
  tripId: string;
  routeId?: string | null;
  busId?: string | null;
  driverId?: string | null;
  status?: string | null;
  endedAt?: string | null;
}
