"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { connectSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import {
  forceEndAdminTrip,
  forceRecoverAdminTrip,
  getAdminOperationsEvents,
  getAdminOperationsOverview,
  getAdminTripOperationsDetail,
  setAdminTripAutoEnd,
} from "@/features/admin/api/admin.operations.api";
import type {
  AdminOperationsEvent,
  AdminOverviewData,
  AdminTripStatus,
} from "@/features/admin/types.contracts";
import {
  mapOverviewTripToSnapshot,
  type AdminTripDetail,
  type AdminTripSnapshot,
} from "@/features/admin/types";
import type { ConnectionStatus } from "@/lib/utils/status";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeEventsResponse(input: unknown): AdminOperationsEvent[] {
  if (Array.isArray(input)) return input as AdminOperationsEvent[];

  if (
    input &&
    typeof input === "object" &&
    Array.isArray((input as { events?: unknown[] }).events)
  ) {
    return (input as { events: AdminOperationsEvent[] }).events;
  }

  return [];
}

function prependEvent(
  current: AdminOperationsEvent[],
  event: AdminOperationsEvent,
  limit = 30,
) {
  const next = [event, ...current.filter((item) => item.id !== event.id)];
  return next.slice(0, limit);
}

function buildLiveEvent(input: {
  type: string;
  tripId: string;
  routeId?: string | null;
  title: string;
  description: string;
}): AdminOperationsEvent {
  const now = new Date().toISOString();

  return {
    id: `live-${input.type}-${input.tripId}-${now}`,
    type: input.type,
    tripId: input.tripId,
    routeId: input.routeId ?? null,
    title: input.title,
    description: input.description,
    createdAt: now,
  };
}

function normalizeLocationPayload(payload: unknown) {
  const data = payload as Record<string, unknown> | null;

  const latitude = asNumber(data?.latitude ?? data?.lat);
  const longitude = asNumber(data?.longitude ?? data?.lng);

  if (latitude == null || longitude == null) return null;

  return {
    tripId: asString(data?.tripId) ?? "",
    routeId: asString(data?.routeId) ?? "",
    busId: asString(data?.busId),
    driverId: asString(data?.driverId),
    latitude,
    longitude,
    speedKmh: asNumber(data?.speedKmh ?? data?.speed),
    heading: asNumber(data?.heading),
    accuracyM: asNumber(data?.accuracyM),
    updatedAt: asString(data?.updatedAt ?? data?.recordedAt),
    sourceType: asString(data?.sourceType),
    sourceStatus: asString(data?.sourceStatus),
    selectionReason: asString(data?.selectionReason),
    sourceLabel: asString(data?.source),
  };
}

function normalizeEtaPayload(payload: unknown) {
  const data = payload as Record<string, any> | null;

  return {
    tripId: asString(data?.tripId) ?? "",
    etaMinutes: asNumber(data?.etaMinutes ?? data?.eta?.etaMinutes),
    nextStopName:
      asString(data?.nextStopName ?? data?.eta?.nextStopName) ??
      asString(data?.eta?.nextStop?.stopName),
    updatedAt: asString(data?.updatedAt ?? data?.eta?.updatedAt),
  };
}

type OperationAction = "force-end" | "force-recover" | "auto-end" | null;

export function useAdminOperations() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] =
    useState<ConnectionStatus>("connecting");

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [events, setEvents] = useState<AdminOperationsEvent[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedTripDetail, setSelectedTripDetail] =
    useState<AdminTripDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<OperationAction>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const snapshots = useMemo<AdminTripSnapshot[]>(() => {
    return (overview?.trips ?? []).map(mapOverviewTripToSnapshot);
  }, [overview]);

  const selectedTrip = useMemo(() => {
    return (
      snapshots.find((item) => item.trip.tripId === selectedTripId)?.trip ??
      null
    );
  }, [selectedTripId, snapshots]);

  const selectedSnapshot = useMemo(() => {
    return (
      snapshots.find((item) => item.trip.tripId === selectedTripId) ?? null
    );
  }, [selectedTripId, snapshots]);

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);

    setError(null);

    try {
      const [overviewData, eventsData] = await Promise.all([
        getAdminOperationsOverview(),
        getAdminOperationsEvents(30),
      ]);

      setOverview((overviewData ?? null) as AdminOverviewData | null);
      setEvents(normalizeEventsResponse(eventsData));

      const trips = overviewData?.trips ?? [];

      if (trips.length > 0) {
        setSelectedTripId((prev) =>
          prev && trips.some((trip: { tripId: string }) => trip.tripId === prev)
            ? prev
            : trips[0].tripId,
        );
      } else {
        setSelectedTripId("");
        setSelectedTripDetail(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to load admin operations data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const retry = useCallback(async () => {
    await load("refresh");
  }, [load]);

  const loadTripDetail = useCallback(async (tripId: string) => {
    if (!tripId) {
      setSelectedTripDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const data = await getAdminTripOperationsDetail(tripId);
      setSelectedTripDetail((data ?? null) as AdminTripDetail | null);
    } catch (err) {
      console.error(err);
      setSelectedTripDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const refreshSelectedTripDetail = useCallback(async () => {
    if (!selectedTripId) return;
    await loadTripDetail(selectedTripId);
  }, [loadTripDetail, selectedTripId]);

  const runAction = useCallback(
    async (action: Exclude<OperationAction, null>) => {
      if (!selectedTripId) return;

      setActionLoading(action);
      setActionMessage(null);
      setActionError(null);

      try {
        if (action === "force-end") {
          const result = await forceEndAdminTrip(selectedTripId);
          setActionMessage(
            result?.alreadyEnded
              ? "Trip was already ended. Admin state is now synchronized."
              : "Trip force-ended successfully.",
          );
        } else {
          await forceRecoverAdminTrip(selectedTripId);
          setActionMessage("Trip operational state recovered successfully.");
        }

        await Promise.all([load("refresh"), refreshSelectedTripDetail()]);
      } catch (err: any) {
        console.error(err);
        setActionError(
          err?.response?.data?.message ||
            "The admin operation could not be completed.",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [load, refreshSelectedTripDetail, selectedTripId],
  );

  const forceEndSelectedTrip = useCallback(async () => {
    await runAction("force-end");
  }, [runAction]);

  const forceRecoverSelectedTrip = useCallback(async () => {
    await runAction("force-recover");
  }, [runAction]);

  const toggleSelectedTripAutoEnd = useCallback(
    async (disabled: boolean) => {
      if (!selectedTripId) return;

      setActionLoading("auto-end");
      setActionMessage(null);
      setActionError(null);

      try {
        await setAdminTripAutoEnd(selectedTripId, disabled);
        setActionMessage(
          disabled
            ? "Auto-end disabled for this trip."
            : "Auto-end re-enabled for this trip.",
        );
        await Promise.all([load("refresh"), refreshSelectedTripDetail()]);
      } catch (err: any) {
        console.error(err);
        setActionError(
          err?.response?.data?.message ||
            "The admin operation could not be completed.",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [load, refreshSelectedTripDetail, selectedTripId],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  useEffect(() => {
    void loadTripDetail(selectedTripId);
  }, [selectedTripId, loadTripDetail]);

  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => {
      setSocketStatus("connected");
    };

    const handleDisconnect = () => {
      setSocketStatus("disconnected");
    };

    const handleReconnectAttempt = () => {
      setSocketStatus("reconnecting");
    };

    const handleConnectError = () => {
      setSocketStatus("error");
    };

    const handleTripLocationUpdated = (payload: unknown) => {
      const normalized = normalizeLocationPayload(payload);
      if (!normalized || !normalized.tripId) return;

      setOverview((prev) => {
        if (!prev) return prev;

        const nextTrips = prev.trips.map((trip) =>
          trip.tripId !== normalized.tripId
            ? trip
            : {
                ...trip,
                liveState: {
                  tripId: normalized.tripId,
                  routeId: normalized.routeId || trip.routeId,
                  busId: normalized.busId ?? trip.busId,
                  driverId: normalized.driverId ?? trip.driverId,
                  latitude: normalized.latitude,
                  longitude: normalized.longitude,
                  speedKmh: normalized.speedKmh,
                  heading: normalized.heading,
                  accuracyM:
                    normalized.accuracyM ?? trip.liveState?.accuracyM ?? null,
                  updatedAt: normalized.updatedAt ?? null,
                },
                selectedSource: trip.selectedSource
                  ? {
                      ...trip.selectedSource,
                      sourceType:
                        (normalized.sourceType as
                          | "DRIVER_MOBILE"
                          | "GPS_DEVICE"
                          | null) ?? trip.selectedSource.sourceType,
                      sourceStatus:
                        (normalized.sourceStatus as
                          | "HEALTHY"
                          | "STALE"
                          | "UNHEALTHY"
                          | "DISCONNECTED"
                          | null) ?? trip.selectedSource.sourceStatus,
                      selectionReason:
                        (normalized.selectionReason as any) ??
                        trip.selectedSource.selectionReason,
                      sourceLabel:
                        normalized.sourceLabel ??
                        trip.selectedSource.sourceLabel,
                      recordedAt:
                        normalized.updatedAt ?? trip.selectedSource.recordedAt,
                    }
                  : trip.selectedSource,
                isStale: false,
              },
        );

        const connectedTrips = nextTrips.reduce((count, trip) => {
          return count + (trip.liveState?.updatedAt ? 1 : 0);
        }, 0);

        const staleTrips = nextTrips.reduce((count, trip) => {
          return count + (trip.isStale ? 1 : 0);
        }, 0);

        return {
          ...prev,
          trips: nextTrips,
          kpis: {
            ...prev.kpis,
            connectedTrips,
            staleTrips,
          },
        };
      });

      if (normalized.tripId === selectedTripId) {
        void refreshSelectedTripDetail();
      }
    };

    const handleTripEtaUpdated = (payload: unknown) => {
      const normalized = normalizeEtaPayload(payload);
      if (!normalized.tripId) return;

      setOverview((prev) => {
        if (!prev) return prev;

        const nextTrips = prev.trips.map((trip) =>
          trip.tripId !== normalized.tripId
            ? trip
            : {
                ...trip,
                eta: {
                  tripId: normalized.tripId,
                  etaMinutes: normalized.etaMinutes,
                  nextStopName: normalized.nextStopName,
                  updatedAt: normalized.updatedAt,
                },
              },
        );

        const etaValues = nextTrips
          .map((trip) => trip.eta?.etaMinutes)
          .filter((value): value is number => typeof value === "number");

        const averageEtaMinutes = etaValues.length
          ? Math.round(
              etaValues.reduce((sum, value) => sum + value, 0) /
                etaValues.length,
            )
          : null;

        return {
          ...prev,
          trips: nextTrips,
          kpis: {
            ...prev.kpis,
            averageEtaMinutes,
          },
        };
      });

      setEvents((prev) =>
        prependEvent(
          prev,
          buildLiveEvent({
            type: "ETA_UPDATED",
            tripId: normalized.tripId,
            title: "ETA updated",
            description:
              normalized.nextStopName && normalized.etaMinutes != null
                ? `Trip ${normalized.tripId} ETA updated to ${normalized.etaMinutes} min for ${normalized.nextStopName}.`
                : normalized.etaMinutes != null
                  ? `Trip ${normalized.tripId} ETA updated to ${normalized.etaMinutes} min.`
                  : `Trip ${normalized.tripId} ETA was updated.`,
          }),
        ),
      );

      if (normalized.tripId === selectedTripId) {
        void refreshSelectedTripDetail();
      }
    };

    const handleTripStarted = async (payload: unknown) => {
      const data = payload as Record<string, unknown> | null;
      const tripId = asString(data?.tripId);
      if (!tripId) return;

      setEvents((prev) =>
        prependEvent(
          prev,
          buildLiveEvent({
            type: "TRIP_STARTED",
            tripId,
            routeId: asString(data?.routeId),
            title: "Trip started",
            description: `Trip ${tripId} has started and entered live operation.`,
          }),
        ),
      );

      await load("refresh");
      if (selectedTripId === tripId) {
        await refreshSelectedTripDetail();
      }
    };

    const handleTripEnded = async (payload: unknown) => {
      const data = payload as Record<string, unknown> | null;
      const tripId = asString(data?.tripId);
      if (!tripId) return;

      setOverview((prev) => {
        if (!prev) return prev;

        const endedStatus: AdminTripStatus = "ENDED";

        const nextTrips = prev.trips.map((trip) =>
          trip.tripId !== tripId
            ? trip
            : {
                ...trip,
                status: endedStatus,
                endedAt: asString(data?.endedAt) ?? trip.endedAt ?? null,
                isStale: false,
              },
        );

        return {
          ...prev,
          trips: nextTrips,
        };
      });

      setEvents((prev) =>
        prependEvent(
          prev,
          buildLiveEvent({
            type: "TRIP_ENDED",
            tripId,
            title: "Trip ended",
            description: `Trip ${tripId} has ended.`,
          }),
        ),
      );

      if (selectedTripId === tripId) {
        await refreshSelectedTripDetail();
      }

      await load("refresh");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("connect_error", handleConnectError);

    socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, handleTripLocationUpdated);
    socket.on(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleTripEtaUpdated);
    socket.on(SOCKET_EVENTS.TRIP_STARTED, handleTripStarted);
    socket.on(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("connect_error", handleConnectError);
      socket.off(
        SOCKET_EVENTS.TRIP_LOCATION_UPDATED,
        handleTripLocationUpdated,
      );
      socket.off(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleTripEtaUpdated);
      socket.off(SOCKET_EVENTS.TRIP_STARTED, handleTripStarted);
      socket.off(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);
    };
  }, [load, refreshSelectedTripDetail, selectedTripId]);

  return {
    loading,
    refreshing,
    error,
    snapshots,
    selectedTripId,
    setSelectedTripId,
    selectedTrip,
    selectedSnapshot,
    selectedTripDetail,
    detailLoading,
    events,
    socketStatus,
    activeTripsCount: overview?.kpis.activeTrips ?? 0,
    staleTripsCount: overview?.kpis.staleTrips ?? 0,
    connectedTripsCount: overview?.kpis.connectedTrips ?? 0,
    gpsSelectedTrips: overview?.kpis.gpsSelectedTrips ?? 0,
    driverSelectedTrips: overview?.kpis.driverSelectedTrips ?? 0,
    averageEta: overview?.kpis.averageEtaMinutes ?? null,
    onlineUsers: overview?.kpis.onlineUsers ?? 0,
    liveWatchers: overview?.kpis.liveWatchers ?? 0,
    pendingSchedules: overview?.kpis.pendingSchedules ?? 0,
    scheduledItems: overview?.scheduledItems ?? [],
    retry,
    actionLoading,
    actionMessage,
    actionError,
    forceEndSelectedTrip,
    forceRecoverSelectedTrip,
    toggleSelectedTripAutoEnd,
    clearActionState: () => {
      setActionMessage(null);
      setActionError(null);
    },
  };
}
