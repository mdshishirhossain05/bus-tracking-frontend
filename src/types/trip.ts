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
  endedAt?: string | null;
  isStale?: boolean;
  live?: {
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
    source?: string;
  } | null;
  eta?: unknown;
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
  rawSpeedKmh?: number | null;
  averageSpeedKmh?: number | null;
  displaySpeedKmh?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
  distanceDeltaMeters?: number | null;
  elapsedSeconds?: number | null;
  source?: string | null;
  updatedAt: string;
}

export interface PassengerLocation {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  updatedAt: string;
}

export interface PassengerNearestStopInfo {
  stopId: string;
  stopName: string;
  stopOrder: number;
  stopLatitude: number;
  stopLongitude: number;
  passengerToStopDistanceMeters: number;
  busToStopDistanceMeters: number | null;
  estimatedBusArrivalMinutes: number | null;
}

export interface TripEta {
  tripId: string;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  nextStopDistanceMeters?: number | null;
  nearestStopName?: string | null;
  nearestStopDistanceMeters?: number | null;
  usedSpeedKmh?: number | null;
  rollingAverageSpeedKmh?: number | null;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | null;
  finalStopReached?: boolean;
  updatedAt?: string | null;
  passengerNearestStop?: PassengerNearestStopInfo | null;
  destinationDistanceMeters?: number | null;
  eta?: {
    etaMinutes?: number | null;
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
