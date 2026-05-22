import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  getActiveTrips,
  getLiveTripState,
  getRoutePresentation,
  getTripEta,
} from "../api/passenger.api";
import { connectSocket } from "../../../lib/socket/socketClient";
import { SOCKET_EVENTS } from "../../../lib/socket/socketEvents";
import type {
  ActiveTrip,
  ConnectionStatus,
  LiveBusLocation,
  PassengerLocation,
  RoutePresentation,
  TripEta,
  TripStopArrivalPayload,
} from "../../../types";

const STALE_AFTER_MS = 60_000;
const ARRIVAL_VISIBILITY_MS = 20_000;

function num(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeSocketLocation(payload: any): LiveBusLocation | null {
  const tripId = str(payload?.tripId);
  const routeId = str(payload?.routeId);
  const latitude = num(payload?.latitude ?? payload?.lat);
  const longitude = num(payload?.longitude ?? payload?.lng);
  if (!tripId || !routeId || latitude == null || longitude == null) return null;

  const displaySpeed =
    num(payload?.displaySpeedKmh) ?? num(payload?.speed ?? payload?.speedKmh);

  return {
    tripId,
    routeId,
    busId: str(payload?.busId),
    driverId: str(payload?.driverId),
    latitude,
    longitude,
    speed: displaySpeed,
    filteredSpeedKmh: num(payload?.filteredSpeedKmh ?? payload?.speedKmh),
    averageSpeedKmh: num(
      payload?.averageSpeedKmh ?? payload?.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: displaySpeed,
    heading: num(payload?.heading),
    accuracyM: num(payload?.accuracyM),
    isStationary:
      typeof payload?.isStationary === "boolean"
        ? payload.isStationary
        : undefined,
    source: str(payload?.source),
    updatedAt:
      str(payload?.updatedAt ?? payload?.recordedAt) ??
      new Date().toISOString(),
  };
}

function isNewer(
  incoming: LiveBusLocation,
  current: LiveBusLocation | null,
): boolean {
  if (!current || current.tripId !== incoming.tripId) return true;
  if (!incoming.updatedAt || !current.updatedAt) return true;
  return (
    new Date(incoming.updatedAt).getTime() >=
    new Date(current.updatedAt).getTime()
  );
}

export function usePassengerLiveTrip() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [liveState, setLiveState] = useState<LiveBusLocation | null>(null);
  const [eta, setEta] = useState<TripEta | null>(null);
  const [route, setRoute] = useState<RoutePresentation | null>(null);
  const [recentArrival, setRecentArrival] =
    useState<TripStopArrivalPayload | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [isStale, setIsStale] = useState(false);
  const [tripEnded, setTripEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passengerLocation, setPassengerLocation] =
    useState<PassengerLocation | null>(null);

  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrivalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinedTripId = useRef<string | null>(null);
  const latestLive = useRef<LiveBusLocation | null>(null);
  const wasDisconnected = useRef(false);
  const routeCache = useRef<Map<string, RoutePresentation>>(new Map());

  const selectedTrip = useMemo(
    () => trips.find((t) => t.tripId === selectedTripId) ?? null,
    [trips, selectedTripId],
  );

  const setLiveSafe = useCallback((next: LiveBusLocation | null) => {
    latestLive.current = next;
    setLiveState(next);
  }, []);

  const clearStaleTimer = useCallback(() => {
    if (staleTimer.current) {
      clearTimeout(staleTimer.current);
      staleTimer.current = null;
    }
  }, []);

  const armStaleTimer = useCallback(() => {
    clearStaleTimer();
    setIsStale(false);
    staleTimer.current = setTimeout(() => {
      setIsStale(true);
      setConnectionStatus((prev) => (prev === "connected" ? "stale" : prev));
    }, STALE_AFTER_MS);
  }, [clearStaleTimer]);

  const showArrival = useCallback((arrival: TripStopArrivalPayload) => {
    setRecentArrival(arrival);
    if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    arrivalTimer.current = setTimeout(
      () => setRecentArrival(null),
      ARRIVAL_VISIBILITY_MS,
    );
  }, []);

  const loadRoute = useCallback(async (routeId: string) => {
    if (!routeId) return;
    const cached = routeCache.current.get(routeId);
    if (cached) {
      setRoute(cached);
      return;
    }
    try {
      const presentation = await getRoutePresentation(routeId);
      if (presentation) {
        routeCache.current.set(routeId, presentation);
        setRoute(presentation);
      }
    } catch {
      // The live map still works without the static route overlay.
    }
  }, []);

  const loadTripData = useCallback(
    async (tripId: string, routeId?: string | null) => {
      const [state, tripEta] = await Promise.all([
        getLiveTripState(tripId),
        getTripEta(tripId),
      ]);
      setLiveSafe(state);
      setEta(tripEta);
      setTripEnded(false);

      const resolvedRouteId = routeId ?? state?.routeId ?? null;
      if (resolvedRouteId) void loadRoute(resolvedRouteId);

      if (state?.updatedAt) armStaleTimer();
      else clearStaleTimer();
    },
    [armStaleTimer, clearStaleTimer, loadRoute, setLiveSafe],
  );

  const loadInitial = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const activeTrips = await getActiveTrips();
        setTrips(activeTrips);

        if (!activeTrips.length) {
          setSelectedTripId("");
          setLiveSafe(null);
          setEta(null);
          setRoute(null);
          clearStaleTimer();
          return;
        }

        const current =
          selectedTripId &&
          activeTrips.some((t) => t.tripId === selectedTripId)
            ? selectedTripId
            : activeTrips[0].tripId;
        const trip = activeTrips.find((t) => t.tripId === current) ?? null;

        setSelectedTripId(current);
        await loadTripData(current, trip?.routeId);
      } catch (err: any) {
        if (mode === "initial") {
          setTrips([]);
          setSelectedTripId("");
          setLiveSafe(null);
        }
        setError(
          err?.response?.data?.message ??
            "Failed to load live tracking. Pull to retry.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clearStaleTimer, loadTripData, selectedTripId, setLiveSafe],
  );

  const selectTrip = useCallback(
    async (tripId: string) => {
      if (tripId === selectedTripId) return;
      setSelectedTripId(tripId);
      setRecentArrival(null);
      setTripEnded(false);
      const trip = trips.find((t) => t.tripId === tripId) ?? null;
      try {
        await loadTripData(tripId, trip?.routeId);
      } catch {
        setError("Failed to switch trips.");
      }
    },
    [loadTripData, selectedTripId, trips],
  );

  const retry = useCallback(() => loadInitial("refresh"), [loadInitial]);

  // Passenger's own position (foreground only) — optional, enhances nearest-stop
  // context. Background streaming is the driver app's job, never the rider's.
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let active = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active || status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (pos) => {
          setPassengerLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyM: pos.coords.accuracy ?? null,
            updatedAt: new Date(pos.timestamp).toISOString(),
          });
        },
      );
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    void loadInitial("initial");
    return () => {
      clearStaleTimer();
      if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTripId) return;
    const socket = connectSocket();
    const tripId = selectedTripId;

    const join = () => {
      if (joinedTripId.current && joinedTripId.current !== tripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, { tripId: joinedTripId.current });
      }
      socket.emit(SOCKET_EVENTS.JOIN_TRIP, { tripId });
      joinedTripId.current = tripId;
    };

    const onConnect = () => {
      setConnectionStatus("connected");
      join();
      if (wasDisconnected.current) {
        wasDisconnected.current = false;
        void loadTripData(tripId).catch(() => undefined);
      }
    };
    const onDisconnect = () => {
      setConnectionStatus("disconnected");
      wasDisconnected.current = true;
    };
    const onReconnectAttempt = () => setConnectionStatus("reconnecting");
    const onConnectError = () => setConnectionStatus("error");

    const onLocation = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      const next = normalizeSocketLocation(payload);
      if (!next || !isNewer(next, latestLive.current)) return;
      setLiveSafe(next);
      setTripEnded(false);
      setConnectionStatus("connected");
      setIsStale(false);
      armStaleTimer();
    };
    const onEta = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      setEta((prev) => ({
        tripId,
        etaMinutes: num(payload?.eta?.etaMinutes ?? payload?.etaMinutes),
        nextStopName:
          str(payload?.nextStopName) ??
          str(payload?.eta?.nextStop?.stopName) ??
          prev?.nextStopName ??
          null,
        nextStopDistanceMeters: num(payload?.eta?.nextStop?.distanceMeters),
        nearestStopName: prev?.nearestStopName ?? null,
        rollingAverageSpeedKmh:
          latestLive.current?.averageSpeedKmh ??
          prev?.rollingAverageSpeedKmh ??
          null,
        confidence: payload?.eta?.confidence ?? prev?.confidence ?? null,
        finalStopReached:
          payload?.eta?.finalStopReached ?? prev?.finalStopReached ?? false,
        updatedAt: str(payload?.updatedAt) ?? new Date().toISOString(),
      }));
    };
    const onStopArrival = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      const stopId = str(payload?.stopId);
      const stopName = str(payload?.stopName);
      if (!stopId || !stopName) return;
      showArrival({
        tripId,
        stopId,
        stopName,
        stopOrder: num(payload?.stopOrder) ?? 0,
        arrivalTime:
          str(payload?.arrivalTime ?? payload?.recordedAt) ??
          new Date().toISOString(),
        recordedAt: str(payload?.recordedAt) ?? new Date().toISOString(),
        distanceMeters: num(payload?.distanceMeters) ?? 0,
        delayMinutes: num(payload?.delayMinutes) ?? 0,
        status: str(payload?.status) ?? "NO_SCHEDULE",
      });
    };
    const onTripEnded = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      setTripEnded(true);
      setConnectionStatus("disconnected");
      setIsStale(false);
      clearStaleTimer();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connect_error", onConnectError);
    socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, onLocation);
    socket.on(SOCKET_EVENTS.TRIP_ETA_UPDATED, onEta);
    socket.on(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, onStopArrival);
    socket.on(SOCKET_EVENTS.TRIP_ENDED, onTripEnded);

    if (socket.connected) onConnect();

    return () => {
      if (joinedTripId.current === tripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, { tripId });
        joinedTripId.current = null;
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("connect_error", onConnectError);
      socket.off(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, onLocation);
      socket.off(SOCKET_EVENTS.TRIP_ETA_UPDATED, onEta);
      socket.off(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, onStopArrival);
      socket.off(SOCKET_EVENTS.TRIP_ENDED, onTripEnded);
    };
  }, [
    selectedTripId,
    armStaleTimer,
    clearStaleTimer,
    loadTripData,
    setLiveSafe,
    showArrival,
  ]);

  return {
    loading,
    refreshing,
    error,
    trips,
    selectedTripId,
    selectedTrip,
    liveState,
    eta,
    route,
    recentArrival,
    connectionStatus,
    isStale,
    tripEnded,
    passengerLocation,
    selectTrip,
    retry,
  };
}
