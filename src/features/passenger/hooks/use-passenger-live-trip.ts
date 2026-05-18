"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getActiveTrips,
  getLiveTripState,
  getTripEta,
} from "@/features/passenger/api/passenger.api";
import { connectSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import type { ConnectionStatus } from "@/lib/utils/status";
import type {
  ActiveTrip,
  LiveBusLocation,
  PassengerLocation,
  PassengerNearestStopInfo,
  TripEta,
} from "@/types/trip";
import type { RoutePresentation } from "@/features/routes/types";
import type { TripStopArrivalPayload } from "@/types/socket";

const ARRIVAL_EVENT_VISIBILITY_MS = 20_000;

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

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function estimateMinutes(distanceMeters: number, speedKmh?: number | null) {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 0;

  const effectiveSpeed = speedKmh != null && speedKmh >= 3 ? speedKmh : 20;

  return Math.max(1, Math.round((distanceMeters / 1000 / effectiveSpeed) * 60));
}

function normalizeEtaShape(input: any): TripEta | null {
  if (!input) return null;

  const root = input?.eta ? input.eta : input;
  const tripId = asString(input?.tripId ?? root?.tripId);

  return {
    tripId: tripId ?? "",
    etaMinutes: asNumber(root?.etaMinutes),
    nextStopName:
      asString(root?.nextStopName) ?? asString(root?.nextStop?.stopName),
    nextStopDistanceMeters:
      asNumber(root?.nextStopDistanceMeters) ??
      asNumber(root?.nextStop?.distanceMeters),
    nearestStopName:
      asString(root?.nearestStopName) ?? asString(root?.nearestStop?.stopName),
    nearestStopDistanceMeters:
      asNumber(root?.nearestStopDistanceMeters) ??
      asNumber(root?.nearestStop?.distanceMeters),
    usedSpeedKmh: asNumber(root?.usedSpeedKmh),
    rollingAverageSpeedKmh: asNumber(root?.rollingAverageSpeedKmh),
    confidence:
      root?.confidence === "HIGH" ||
      root?.confidence === "MEDIUM" ||
      root?.confidence === "LOW"
        ? root.confidence
        : null,
    finalStopReached:
      typeof root?.finalStopReached === "boolean"
        ? root.finalStopReached
        : false,
    updatedAt:
      asString(input?.updatedAt ?? input?.recordedAt ?? root?.updatedAt) ??
      null,
    eta: input?.eta ?? root?.eta ?? null,
  };
}

function normalizeSocketLiveState(payload: any): LiveBusLocation | null {
  const tripId = asString(payload?.tripId);
  const routeId = asString(payload?.routeId);
  const latitude = asNumber(payload?.latitude ?? payload?.lat);
  const longitude = asNumber(payload?.longitude ?? payload?.lng);

  if (!tripId || !routeId || latitude == null || longitude == null) {
    return null;
  }

  const displaySpeed =
    asNumber(payload?.displaySpeedKmh) ??
    asNumber(payload?.speed ?? payload?.speedKmh);

  return {
    tripId,
    routeId,
    busId: asString(payload?.busId),
    driverId: asString(payload?.driverId),
    latitude,
    longitude,
    speed: displaySpeed,
    filteredSpeedKmh: asNumber(payload?.filteredSpeedKmh ?? payload?.speedKmh),
    rawSpeedKmh: asNumber(payload?.rawSpeedKmh),
    averageSpeedKmh: asNumber(
      payload?.averageSpeedKmh ?? payload?.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: displaySpeed,
    heading: asNumber(payload?.heading),
    accuracyM: asNumber(payload?.accuracyM),
    isStationary:
      typeof payload?.isStationary === "boolean"
        ? payload.isStationary
        : undefined,
    distanceDeltaMeters: asNumber(payload?.distanceDeltaMeters),
    elapsedSeconds: asNumber(payload?.elapsedSeconds),
    source: asString(payload?.source),
    updatedAt:
      asString(payload?.updatedAt ?? payload?.recordedAt) ??
      new Date().toISOString(),
  };
}

function normalizeStopArrivalPayload(
  payload: any,
): TripStopArrivalPayload | null {
  const tripId = asString(payload?.tripId);
  const stopId = asString(payload?.stopId);
  const stopName = asString(payload?.stopName);
  const arrivalTime = asString(payload?.arrivalTime ?? payload?.recordedAt);
  const recordedAt = asString(payload?.recordedAt ?? payload?.arrivalTime);
  const stopOrder = asNumber(payload?.stopOrder);
  const distanceMeters = asNumber(payload?.distanceMeters);
  const dayType = asString(payload?.dayType);
  const status = asString(payload?.status);

  if (
    !tripId ||
    !stopId ||
    !stopName ||
    !arrivalTime ||
    !recordedAt ||
    stopOrder == null ||
    distanceMeters == null ||
    !dayType ||
    !status
  ) {
    return null;
  }

  return {
    tripId,
    routeId: asString(payload?.routeId),
    busId: asString(payload?.busId),
    driverId: asString(payload?.driverId),
    stopId,
    stopName,
    stopOrder,
    arrivalTime,
    recordedAt,
    distanceMeters,
    dayType,
    scheduledTime: asString(payload?.scheduledTime),
    scheduledDateUtc: asString(payload?.scheduledDateUtc),
    delayMinutes: asNumber(payload?.delayMinutes) ?? 0,
    status,
  };
}

function buildPassengerNearestStop(params: {
  passengerLocation: PassengerLocation | null;
  routePresentation: RoutePresentation | null;
  liveState: LiveBusLocation | null;
}): PassengerNearestStopInfo | null {
  const { passengerLocation, routePresentation, liveState } = params;

  if (!passengerLocation || !routePresentation?.stops?.length) return null;

  let nearest = routePresentation.stops[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const stop of routePresentation.stops) {
    const distance = haversineMeters(
      passengerLocation.latitude,
      passengerLocation.longitude,
      stop.latitude,
      stop.longitude,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = stop;
    }
  }

  const busToStopDistanceMeters =
    liveState != null
      ? haversineMeters(
          liveState.latitude,
          liveState.longitude,
          nearest.latitude,
          nearest.longitude,
        )
      : null;

  const speedForEta =
    liveState?.displaySpeedKmh ??
    liveState?.averageSpeedKmh ??
    liveState?.filteredSpeedKmh ??
    liveState?.speed ??
    null;

  return {
    stopId: nearest.id,
    stopName: nearest.name,
    stopOrder: nearest.order,
    stopLatitude: nearest.latitude,
    stopLongitude: nearest.longitude,
    passengerToStopDistanceMeters: Math.round(nearestDistance),
    busToStopDistanceMeters:
      busToStopDistanceMeters != null
        ? Math.round(busToStopDistanceMeters)
        : null,
    estimatedBusArrivalMinutes:
      busToStopDistanceMeters != null
        ? estimateMinutes(busToStopDistanceMeters, speedForEta)
        : null,
  };
}

function buildDestinationDistance(params: {
  liveState: LiveBusLocation | null;
  routePresentation: RoutePresentation | null;
}) {
  const { liveState, routePresentation } = params;

  if (!liveState || !routePresentation?.destination) return null;

  return Math.round(
    haversineMeters(
      liveState.latitude,
      liveState.longitude,
      routePresentation.destination.latitude,
      routePresentation.destination.longitude,
    ),
  );
}

/**
 * Guards against out-of-order live-state writes — a late REST response or a
 * delayed socket packet must never overwrite fresher data.
 */
function isLiveStateNewer(
  incoming: LiveBusLocation,
  current: LiveBusLocation | null,
): boolean {
  if (!current) return true;
  if (current.tripId !== incoming.tripId) return true;
  if (!incoming.updatedAt || !current.updatedAt) return true;
  return (
    new Date(incoming.updatedAt).getTime() >=
    new Date(current.updatedAt).getTime()
  );
}

export function usePassengerLiveTrip(initialTripId?: string | null) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [liveState, setLiveState] = useState<LiveBusLocation | null>(null);
  const [eta, setEta] = useState<TripEta | null>(null);
  const [recentArrival, setRecentArrival] =
    useState<TripStopArrivalPayload | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [tripEnded, setTripEnded] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [staleAfterMs, setStaleAfterMs] = useState(60_000);
  const [passengerLocation, setPassengerLocation] =
    useState<PassengerLocation | null>(null);

  const staleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const joinedTripIdRef = useRef<string | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const arrivalVisibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestLiveStateRef = useRef<LiveBusLocation | null>(null);
  const wasDisconnectedRef = useRef(false);

  const selectedTrip = useMemo(() => {
    return trips.find((trip) => trip.tripId === selectedTripId) ?? null;
  }, [trips, selectedTripId]);

  useEffect(() => {
    latestLiveStateRef.current = liveState;
  }, [liveState]);

  const setLiveStateSafe = useCallback((next: LiveBusLocation | null) => {
    latestLiveStateRef.current = next;
    setLiveState(next);
  }, []);

  const clearStaleTimer = useCallback(() => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  }, []);

  const clearArrivalVisibilityTimer = useCallback(() => {
    if (arrivalVisibilityTimerRef.current) {
      clearTimeout(arrivalVisibilityTimerRef.current);
      arrivalVisibilityTimerRef.current = null;
    }
  }, []);

  const armStaleTimer = useCallback(() => {
    clearStaleTimer();
    setIsStale(false);

    staleTimerRef.current = setTimeout(() => {
      setIsStale(true);
      setConnectionStatus((prev) => (prev === "connected" ? "stale" : prev));
    }, staleAfterMs);
  }, [clearStaleTimer, staleAfterMs]);

  const showRecentArrival = useCallback(
    (arrival: TripStopArrivalPayload | null) => {
      if (!arrival) return;

      setRecentArrival(arrival);
      clearArrivalVisibilityTimer();

      arrivalVisibilityTimerRef.current = setTimeout(() => {
        setRecentArrival((current) =>
          current?.stopId === arrival.stopId &&
          current?.arrivalTime === arrival.arrivalTime
            ? null
            : current,
        );
      }, ARRIVAL_EVENT_VISIBILITY_MS);
    },
    [clearArrivalVisibilityTimer],
  );

  const loadTripData = useCallback(
    async (tripId: string) => {
      const [tripState, tripEta] = await Promise.all([
        getLiveTripState(tripId),
        getTripEta(tripId),
      ]);

      const normalizedEta = normalizeEtaShape(tripEta ?? null);

      setLiveStateSafe(tripState ?? null);
      setEta(normalizedEta);
      setTripEnded(false);

      if (tripState?.updatedAt) {
        armStaleTimer();
      } else {
        clearStaleTimer();
      }
    },
    [armStaleTimer, clearStaleTimer, setLiveStateSafe],
  );

  const loadInitial = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      setError(null);

      try {
        const activeTrips = await getActiveTrips();
        const safeTrips = Array.isArray(activeTrips) ? activeTrips : [];
        setTrips(safeTrips);

        if (!safeTrips.length) {
          setSelectedTripId("");
          setLiveStateSafe(null);
          setEta(null);
          setTripEnded(false);
          setRecentArrival(null);
          clearStaleTimer();
          return;
        }

        const requestedTripId =
          initialTripId &&
          safeTrips.some((trip) => trip.tripId === initialTripId)
            ? initialTripId
            : null;

        const currentTripId =
          selectedTripId &&
          safeTrips.some((trip) => trip.tripId === selectedTripId)
            ? selectedTripId
            : null;

        const nextTripId =
          requestedTripId ?? currentTripId ?? safeTrips[0].tripId;

        setSelectedTripId(nextTripId);
        await loadTripData(nextTripId);
      } catch (err: any) {
        console.error(err);
        setTrips([]);
        setSelectedTripId("");
        setLiveStateSafe(null);
        setEta(null);
        setTripEnded(false);
        setRecentArrival(null);
        clearStaleTimer();
        setError(
          err?.response?.data?.message ||
            "Failed to load passenger live tracking data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      clearStaleTimer,
      initialTripId,
      loadTripData,
      selectedTripId,
      setLiveStateSafe,
    ],
  );

  const selectTrip = useCallback(
    async (tripId: string) => {
      setSelectedTripId(tripId);
      setError(null);
      setRecentArrival(null);
      setTripEnded(false);
      clearArrivalVisibilityTimer();

      try {
        await loadTripData(tripId);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Failed to switch to the selected trip.",
        );
      }
    },
    [clearArrivalVisibilityTimer, loadTripData],
  );

  const retry = useCallback(async () => {
    await loadInitial("refresh");
  }, [loadInitial]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPassengerLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy ?? null,
          updatedAt: new Date(position.timestamp).toISOString(),
        });
      },
      () => {
        // Passenger location is optional; live bus map still works without it.
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );

    return () => {
      if (geoWatchIdRef.current != null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    void loadInitial("initial");

    return () => {
      clearStaleTimer();
      clearArrivalVisibilityTimer();
    };
  }, [clearArrivalVisibilityTimer, clearStaleTimer, loadInitial]);

  useEffect(() => {
    if (!selectedTripId) return;

    const socket = connectSocket();
    const activeTripId = selectedTripId;

    const joinSelectedTrip = () => {
      if (joinedTripIdRef.current && joinedTripIdRef.current !== activeTripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, {
          tripId: joinedTripIdRef.current,
        });
      }

      socket.emit(SOCKET_EVENTS.JOIN_TRIP, { tripId: activeTripId });
      joinedTripIdRef.current = activeTripId;
    };

    const handleConnect = () => {
      setConnectionStatus("connected");
      joinSelectedTrip();

      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        // Resync authoritative state from REST right after a reconnect rather
        // than waiting several seconds for the next socket broadcast.
        void loadTripData(activeTripId).catch(() => {
          // Non-fatal: the next socket packet will refresh state.
        });
      }
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      wasDisconnectedRef.current = true;
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus("reconnecting");
    };

    const handleConnectError = () => {
      setConnectionStatus("error");
    };

    const handleLocationUpdated = (payload: any) => {
      if (payload?.tripId !== activeTripId) return;

      const normalized = normalizeSocketLiveState(payload);
      if (!normalized) return;

      // Drop packets that are older than what we already display.
      if (!isLiveStateNewer(normalized, latestLiveStateRef.current)) return;

      setLiveStateSafe(normalized);
      setEta((prev) =>
        prev
          ? {
              ...prev,
              rollingAverageSpeedKmh:
                normalized.averageSpeedKmh ??
                prev.rollingAverageSpeedKmh ??
                null,
              updatedAt: normalized.updatedAt ?? prev.updatedAt ?? null,
            }
          : prev,
      );

      setTripEnded(false);
      setConnectionStatus("connected");
      setIsStale(false);
      armStaleTimer();
    };

    const handleEtaUpdated = (payload: any) => {
      if (payload?.tripId !== activeTripId) return;

      const normalizedEta = normalizeEtaShape(payload);
      if (!normalizedEta) return;

      const latestAverageSpeed = latestLiveStateRef.current?.averageSpeedKmh;

      if (latestAverageSpeed != null) {
        normalizedEta.rollingAverageSpeedKmh = latestAverageSpeed;
      }

      setEta(normalizedEta);
    };

    const handleStopArrival = (payload: any) => {
      if (payload?.tripId !== activeTripId) return;

      const normalizedArrival = normalizeStopArrivalPayload(payload);
      if (!normalizedArrival) return;

      showRecentArrival(normalizedArrival);
    };

    const handleTripEnded = (payload: any) => {
      if (payload?.tripId !== activeTripId) return;

      setTripEnded(true);
      setConnectionStatus("disconnected");
      setIsStale(false);
      setRecentArrival(null);
      clearStaleTimer();
      clearArrivalVisibilityTimer();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("connect_error", handleConnectError);

    socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, handleLocationUpdated);
    socket.on(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleEtaUpdated);
    socket.on(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, handleStopArrival);
    socket.on(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (joinedTripIdRef.current === activeTripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, {
          tripId: activeTripId,
        });
        joinedTripIdRef.current = null;
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("connect_error", handleConnectError);
      socket.off(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, handleLocationUpdated);
      socket.off(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleEtaUpdated);
      socket.off(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, handleStopArrival);
      socket.off(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);
    };
  }, [
    selectedTripId,
    armStaleTimer,
    clearArrivalVisibilityTimer,
    clearStaleTimer,
    loadTripData,
    setLiveStateSafe,
    showRecentArrival,
  ]);

  const decorateEtaWithPassengerContext = useCallback(
    (routePresentation: RoutePresentation | null) => {
      const currentLiveState = latestLiveStateRef.current;

      const passengerNearestStop = buildPassengerNearestStop({
        passengerLocation,
        routePresentation,
        liveState: currentLiveState,
      });

      const destinationDistanceMeters = buildDestinationDistance({
        liveState: currentLiveState,
        routePresentation,
      });

      setEta((prev) => {
        if (
          !prev &&
          !passengerNearestStop &&
          destinationDistanceMeters == null
        ) {
          return prev;
        }

        return {
          ...(prev ?? { tripId: selectedTripId }),
          passengerNearestStop,
          destinationDistanceMeters,
        };
      });
    },
    [passengerLocation, selectedTripId],
  );

  return {
    loading,
    refreshing,
    error,
    trips,
    selectedTripId,
    selectedTrip,
    liveState,
    eta,
    recentArrival,
    connectionStatus,
    isStale,
    tripEnded,
    staleAfterMs,
    setStaleAfterMs,
    passengerLocation,
    retry,
    selectTrip,
    decorateEtaWithPassengerContext,
  };
}
