export type AdminTripStatus = "PLANNED" | "RUNNING" | "ENDED";

export type AdminTripActivationMode =
  | "MANUAL_DRIVER"
  | "AUTO_TELEMATICS"
  | "MANUAL_ADMIN";

export type AdminTrackingSourceType = "DRIVER_MOBILE" | "GPS_DEVICE";
export type AdminTrackingSourceStatus =
  | "HEALTHY"
  | "STALE"
  | "UNHEALTHY"
  | "DISCONNECTED";
export type AdminTrackingSelectionReason =
  | "DRIVER_ONLY"
  | "GPS_ONLY"
  | "GPS_PRIORITY"
  | "DRIVER_PRIORITY"
  | "GPS_FALLBACK_TO_DRIVER"
  | "DRIVER_FALLBACK_TO_GPS"
  | "MOST_RECENT_HEALTHY"
  | "NO_HEALTHY_SOURCE";

export interface AdminSelectedSourceSummary {
  sourceType: AdminTrackingSourceType;
  sourceStatus: AdminTrackingSourceStatus | null;
  selectionReason: AdminTrackingSelectionReason | null;
  sourceLabel: string | null;
  recordedAt: string | null;
}

export interface AdminAvailableSourceSummary {
  sourceType: AdminTrackingSourceType;
  sourceStatus: AdminTrackingSourceStatus;
  sourceLabel: string | null;
  driverId: string | null;
  gpsDeviceId: string | null;
  recordedAt: string | null;
  lastSeenAt: string | null;
  healthScore: number;
  isSelected: boolean;
  priorityRank: number;
}

export interface AdminOverviewTrip {
  tripId: string;
  routeId: string;
  routeName: string;
  busId: string;
  busLabel: string;
  plateNumber?: string | null;
  driverId: string;
  driverName: string;
  status: AdminTripStatus;
  startedAt: string | null;
  endedAt: string | null;
  activationMode?: AdminTripActivationMode | null;
  startedByGpsDeviceId?: string | null;
  liveState: {
    tripId: string;
    routeId: string;
    busId: string;
    driverId: string;
    latitude: number | null;
    longitude: number | null;
    speedKmh: number | null;
    heading: number | null;
    accuracyM: number | null;
    updatedAt: string | null;
  } | null;
  eta: {
    tripId: string;
    etaMinutes: number | null;
    nextStopName: string | null;
    updatedAt: string | null;
  } | null;
  selectedSource: AdminSelectedSourceSummary | null;
  availableSources: AdminAvailableSourceSummary[];
  isStale: boolean;
}

export interface AdminOverviewData {
  kpis: {
    activeTrips: number;
    staleTrips: number;
    connectedTrips: number;
    gpsSelectedTrips: number;
    driverSelectedTrips: number;
    averageEtaMinutes: number | null;
    onlineUsers: number;
    liveWatchers: number;
  };
  trips: AdminOverviewTrip[];
}

export interface AdminOperationsEvent {
  id: string;
  type: string;
  tripId: string;
  routeId: string | null;
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminSourceDiagnosticsCanonicalLiveState {
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  speedKmh?: number | null;
  filteredSpeedKmh?: number | null;
  rawSpeedKmh?: number | null;
  averageSpeedKmh?: number | null;
  displaySpeedKmh?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  recordedAt?: string | null;
  updatedAt?: string | null;
  ageSeconds?: number | null;
  sourceType?: AdminTrackingSourceType | null;
  sourceStatus?: AdminTrackingSourceStatus | null;
  selectionReason?: AdminTrackingSelectionReason | null;
  sourceLabel?: string | null;
  isStationary?: boolean;
  distanceDeltaMeters?: number | null;
  elapsedSeconds?: number | null;
}

export interface AdminSourceStateDetails {
  sourceType: AdminTrackingSourceType;
  sourceStatus: AdminTrackingSourceStatus;
  sourceLabel: string | null;
  driverId: string | null;
  gpsDeviceId: string | null;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  rawSpeedKmh: number | null;
  averageSpeedKmh: number | null;
  displaySpeedKmh: number | null;
  heading: number | null;
  accuracyM: number | null;
  recordedAt: string | null;
  lastSeenAt: string | null;
  recordedAgeSeconds: number | null;
  lastSeenAgeSeconds: number | null;
  healthScore: number;
  isSelected: boolean;
  priorityRank: number;
}

export interface AdminTripSourceDiagnostics {
  trip: {
    id: string;
    status: AdminTripStatus;
    startedAt: string | null;
    endedAt: string | null;
    isStale: boolean;
  };
  route: {
    id: string;
    routeName: string;
  };
  bus: {
    id: string;
    busCode: string;
    plateNumber: string | null;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
  };
  canonical: {
    selectedSource: {
      sourceType: AdminTrackingSourceType;
      sourceStatus: AdminTrackingSourceStatus | null;
      selectionReason: AdminTrackingSelectionReason | null;
      sourceLabel: string | null;
      recordedAt: string | null;
      ageSeconds: number | null;
    } | null;
    liveState: AdminSourceDiagnosticsCanonicalLiveState | null;
    dbSnapshot: {
      lastLatitude: number | null;
      lastLongitude: number | null;
      lastSpeedKmh: number | null;
      lastHeading: number | null;
      lastAccuracyM: number | null;
      lastLocationAt: string | null;
    };
  };
  sources: {
    driverMobile: AdminSourceStateDetails | null;
    gpsDevice: AdminSourceStateDetails | null;
  };
  assignment: {
    id: string;
    assignedAt: string;
    notes: string | null;
    gpsDevice: {
      id: string;
      deviceCode: string;
      serialNumber: string | null;
      displayName: string | null;
      vendorName: string | null;
      modelName: string | null;
      imei: string | null;
      isActive: boolean;
      lastSeenAt: string | null;
      lastRecordedAt: string | null;
      lastStatus: AdminTrackingSourceStatus | null;
      lastLat: number | null;
      lastLng: number | null;
      lastSpeedKmh: number | null;
      lastHeading: number | null;
      lastAccuracyM: number | null;
    };
  } | null;
}

export interface AdminTripOperationsDetail {
  trip: {
    id: string;
    routeId: string;
    routeName: string;
    busId: string;
    busLabel: string;
    plateNumber: string | null;
    driverId: string;
    driverName: string;
    driverEmail: string;
    serviceScheduleId: string | null;
    status: AdminTripStatus;
    activationMode: AdminTripActivationMode | null;
    startedByGpsDeviceId: string | null;
    startedAt: string | null;
    endedAt: string | null;
    isStale: boolean;
    etaMinutes: number | null;
    nextStopName: string | null;
  };
  canonical: {
    selectedSource: {
      sourceType: AdminTrackingSourceType;
      sourceStatus: AdminTrackingSourceStatus | null;
      selectionReason: AdminTrackingSelectionReason | null;
      sourceLabel: string | null;
      recordedAt: string | null;
      ageSeconds: number | null;
    } | null;
    liveState: AdminSourceDiagnosticsCanonicalLiveState | null;
    dbSnapshot: {
      latitude: number | null;
      longitude: number | null;
      speedKmh: number | null;
      heading: number | null;
      accuracyM: number | null;
      recordedAt: string | null;
    };
  };
  sources: {
    driverMobile: AdminSourceStateDetails | null;
    gpsDevice: AdminSourceStateDetails | null;
  };
  recentEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    payload: unknown;
    createdAt: string;
  }>;
  actions: {
    canForceEnd: boolean;
    canForceRecover: boolean;
  };
}
