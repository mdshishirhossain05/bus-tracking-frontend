import type {
  AdminOverviewTrip,
  AdminOperationsEvent,
  AdminTrackingSelectionReason,
  AdminTrackingSourceStatus,
  AdminTrackingSourceType,
  AdminTripOperationsDetail,
  AdminTripSourceDiagnostics,
  AdminTripStatus,
  AdminTripActivationMode,
} from "@/features/admin/types.contracts";

export interface AdminTripSnapshot {
  trip: {
    tripId: string;
    routeId: string;
    routeName: string;
    busId: string;
    busLabel: string;
    plateNumber?: string | null;
    driverId: string;
    driverName: string;
    status: AdminTripStatus;
    activationMode?: AdminTripActivationMode | null;
    startedByGpsDeviceId?: string | null;
    startedAt: string | null;
    endedAt: string | null;
    autoEndDisabled?: boolean;
  };
  liveState: {
    tripId: string;
    routeId: string;
    busId: string;
    driverId: string;
    latitude: number | null;
    longitude: number | null;
    speed?: number | null;
    speedKmh?: number | null;
    heading?: number | null;
    accuracyM?: number | null;
    updatedAt: string | null;
  } | null;
  eta: {
    tripId: string;
    etaMinutes: number | null;
    nextStopName: string | null;
    updatedAt: string | null;
  } | null;
  selectedSource: {
    sourceType: AdminTrackingSourceType;
    sourceStatus: AdminTrackingSourceStatus | null;
    selectionReason: AdminTrackingSelectionReason | null;
    sourceLabel: string | null;
    recordedAt: string | null;
  } | null;
  availableSources: Array<{
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
  }>;
  isStale: boolean;
}

export type AdminEventItem = AdminOperationsEvent;
export type AdminTripDiagnostics = AdminTripSourceDiagnostics;
export type AdminTripDetail = AdminTripOperationsDetail;

export function mapOverviewTripToSnapshot(
  trip: AdminOverviewTrip,
): AdminTripSnapshot {
  return {
    trip: {
      tripId: trip.tripId,
      routeId: trip.routeId,
      routeName: trip.routeName,
      busId: trip.busId,
      busLabel: trip.busLabel,
      plateNumber: trip.plateNumber ?? null,
      driverId: trip.driverId,
      driverName: trip.driverName,
      status: trip.status,
      activationMode: trip.activationMode ?? null,
      startedByGpsDeviceId: trip.startedByGpsDeviceId ?? null,
      startedAt: trip.startedAt,
      endedAt: trip.endedAt,
      autoEndDisabled: trip.autoEndDisabled ?? false,
    },
    liveState: trip.liveState
      ? {
          ...trip.liveState,
          speed: trip.liveState.speedKmh,
        }
      : null,
    eta: trip.eta ?? null,
    selectedSource: trip.selectedSource ?? null,
    availableSources: trip.availableSources ?? [],
    isStale: trip.isStale,
  };
}
