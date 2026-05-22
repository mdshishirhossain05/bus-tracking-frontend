export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "stale"
  | "error";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive?: boolean;
  approvalStatus?: string | null;
}

export interface ActiveTrip {
  tripId: string;
  routeId: string;
  routeName?: string | null;
  busId?: string | null;
  busLabel?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  status: string;
  startedAt: string | null;
  isStale?: boolean;
}

export interface LiveBusLocation {
  tripId: string;
  routeId: string;
  busId?: string | null;
  driverId?: string | null;
  latitude: number;
  longitude: number;
  speed?: number | null;
  filteredSpeedKmh?: number | null;
  averageSpeedKmh?: number | null;
  displaySpeedKmh?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
  source?: string | null;
  updatedAt: string;
}

export interface PassengerLocation {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  updatedAt: string;
}

export interface TripEta {
  tripId: string;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  nextStopDistanceMeters?: number | null;
  nearestStopName?: string | null;
  rollingAverageSpeedKmh?: number | null;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | null;
  finalStopReached?: boolean;
  updatedAt?: string | null;
}

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface RoutePresentation {
  routeId: string;
  routeName: string;
  polyline: [number, number][];
  stops: RouteStop[];
  origin?: RouteStop | null;
  destination?: RouteStop | null;
}

export interface TripStopArrivalPayload {
  tripId: string;
  stopId: string;
  stopName: string;
  stopOrder: number;
  arrivalTime: string;
  recordedAt: string;
  distanceMeters: number;
  delayMinutes: number;
  status: "NO_SCHEDULE" | "LATE" | "EARLY" | "ON_TIME" | string;
}
