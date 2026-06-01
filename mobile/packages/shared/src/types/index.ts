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

export type TripPreTripPhaseValue =
  | "AT_DEPOT"
  | "APPROACHING_ORIGIN"
  | "AT_ORIGIN";

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
  preTripPhase?: TripPreTripPhaseValue | null;
  preTripStartedAt?: string | null;
  originArrivedAt?: string | null;
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

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive?: boolean;
  studentId?: string | null;
  phoneNumber?: string | null;
  academicDepartment?: string | null;
  academicBatch?: string | null;
  transportPickupPoint?: string | null;
  approvalStatus?: string | null;
  registrationSource?: string | null;
  createdAt?: string | null;
}

export interface UpdateProfileInput {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  academicDepartment?: string | null;
  academicBatch?: string | null;
  transportPickupPoint?: string | null;
}

export interface SessionInfo {
  id: string;
  deviceLabel?: string | null;
  userAgentRaw?: string | null;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  ipFirst?: string | null;
  ipLast?: string | null;
  lastSeenIp?: string | null;
  current?: boolean;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: NotificationItem[];
  unreadCount: number;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  quietHoursStartMin: number | null;
  quietHoursEndMin: number | null;
}

export interface StopSubscription {
  id: string;
  stopId: string;
  stopName: string;
  routeId: string;
  routeName: string;
  leadTimeMinutes: number;
  enabled: boolean;
  createdAt: string;
}

export interface VisitRecord {
  id: string;
  routeId: string;
  routeName: string;
  tripId: string | null;
  visitedAt: string;
  durationSeconds: number | null;
}

export interface VisitStats {
  visitCount30Days: number;
  uniqueRoutes30Days: number;
  totalMinutesTracked: number;
  longestStreakDays: number;
  topRoutes: { routeId: string; routeName: string; count: number }[];
}

export type OccupancyLevel = "LIGHT" | "MODERATE" | "FULL";

export interface OccupancyAggregate {
  tripId: string;
  level: OccupancyLevel | null;
  voteCount: number;
  counts: Record<OccupancyLevel, number>;
  myVote: OccupancyLevel | null;
}

export type ServiceAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface ServiceAlert {
  id: string;
  title: string;
  body: string;
  severity: ServiceAlertSeverity;
  routeId: string | null;
  routeName: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export type ScheduleTodayStatus =
  | "PLANNED"
  | "PRE_TRIP"
  | "RUNNING"
  | "ENDED";

export interface ScheduleTodayTripState {
  id: string;
  status: ScheduleTodayStatus;
  preTripPhase: TripPreTripPhaseValue | null;
  startedAt: string | null;
  endedAt: string | null;
  lastEtaMinutes: number | null;
  nextStopName: string | null;
}

export interface ScheduleTodayItem {
  scheduleId: string;
  routeId: string;
  routeName: string;
  busId: string;
  busLabel: string;
  driverId: string | null;
  driverName: string | null;
  /** HH:mm:ss in Dhaka local time. */
  departureTime: string;
  /** UTC instant for today's departure (admin-entered local time on today's date). */
  departureAtIso: string;
  notes: string | null;
  isFavorite: boolean;
  trip: ScheduleTodayTripState | null;
}

export interface FavoriteRoute {
  id: string;
  routeId: string;
  routeName: string;
  description?: string | null;
  isActive?: boolean;
  favoritedAt?: string | null;
}

export interface RouteLiveBus {
  tripId: string;
  routeId: string;
  busId?: string | null;
  busLabel?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  speedKmh?: number | null;
  avgSpeedKmh?: number | null;
  heading?: number | null;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  nextStopDistanceMeters?: number | null;
  nearestStopName?: string | null;
  finalStopReached?: boolean;
  confidence?: "HIGH" | "MEDIUM" | "LOW" | string | null;
  sourceType?: "GPS_DEVICE" | "DRIVER_MOBILE" | string | null;
  sourceLabel?: string | null;
  sourceStatus?: "HEALTHY" | "STALE" | "UNHEALTHY" | "DISCONNECTED" | string | null;
  stopEtas?:
    | {
        stopId: string;
        stopName?: string | null;
        stopOrder?: number | null;
        etaMinutes?: number | null;
        distanceMeters?: number | null;
      }[]
    | null;
  updatedAt?: string | null;
  isStale?: boolean;
}
