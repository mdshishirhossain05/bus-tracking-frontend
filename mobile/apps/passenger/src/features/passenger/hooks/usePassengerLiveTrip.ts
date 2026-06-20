import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  getActiveTrips,
  getLiveTripState,
  getRoutePresentation,
  getTripEta,
} from "../api/passenger.api";
import {
  connectSocket,
  endRouteVisit,
  startRouteVisit,
} from "@ubts/shared";
import { SOCKET_EVENTS } from "@ubts/shared";
import type {
  ActiveTrip,
  ConnectionStatus,
  LiveBusLocation,
  PassengerLocation,
  RoutePresentation,
  TripEta,
  TripPreTripPhaseValue,
  TripStopArrivalPayload,
} from "@ubts/shared";

export type PreTripPhaseState = {
  phase: TripPreTripPhaseValue;
  distanceToOriginMeters: number | null;
  originArrivedAt: string | null;
  updatedAt: string;
};

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

/**
 * Decide whether an incoming live fix should replace the current one.
 *
 * The map MUST keep moving whenever the bus moves. A naive
 * "incoming.updatedAt >= current.updatedAt" guard is dangerous here:
 * the socket carries the GPS device's own `recordedAt` clock, while the
 * current state may have been seeded from a REST response stamped with a
 * different clock. If the device clock runs even slightly behind the
 * server (or one bad fix arrives with a future timestamp), every later
 * socket fix looks "older" and gets dropped forever — the bus freezes on
 * the map even though ETA/progression (which has no such guard) keeps
 * updating. That was exactly the reported failure.
 *
 * So: any change in POSITION is always accepted (a moving bus is never
 * held back by clock skew). Only when the coordinates are identical do we
 * fall back to a timestamp check, purely to refresh speed/heading without
 * thrashing on exact-duplicate frames.
 */
function shouldApplyFix(
  incoming: LiveBusLocation,
  current: LiveBusLocation | null,
): boolean {
  if (!current || current.tripId !== incoming.tripId) return true;
  if (
    incoming.latitude !== current.latitude ||
    incoming.longitude !== current.longitude
  ) {
    return true;
  }
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
  const [preTripPhase, setPreTripPhase] = useState<PreTripPhaseState | null>(
    null,
  );
  /**
   * Wall-clock of the most recent successful trip-data fetch (REST OR
   * socket update). This is the real "are we online?" signal — if the
   * REST API is responding, the user is functionally online regardless
   * of whether the WebSocket has connected. ConnectionPill + OfflineBanner
   * both gate on this so socket flapping never trips a false alarm.
   */
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);

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

  const seedPreTripFromTrip = useCallback((trip: ActiveTrip | null) => {
    if (!trip || trip.status !== "PRE_TRIP" || !trip.preTripPhase) {
      setPreTripPhase(null);
      return;
    }
    setPreTripPhase({
      phase: trip.preTripPhase,
      distanceToOriginMeters: null,
      originArrivedAt: trip.originArrivedAt ?? null,
      updatedAt: trip.preTripStartedAt ?? new Date().toISOString(),
    });
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
      // Mark this round-trip as proof we're reachable, regardless of
      // whether GPS data has actually arrived yet.
      setLastFetchAt(new Date().toISOString());

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
          setPreTripPhase(null);
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
        seedPreTripFromTrip(trip);
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
      seedPreTripFromTrip(trip);
      try {
        await loadTripData(tripId, trip?.routeId);
      } catch {
        setError("Failed to switch trips.");
      }
    },
    [loadTripData, seedPreTripFromTrip, selectedTripId, trips],
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

  /**
   * REST polling fallback while a trip is selected. Without this, a
   * dropped Socket.IO connection would leave the live screen frozen and
   * the connection pill stuck on "Error" forever — exactly what the
   * pilot users were hitting. Polling at 10s gives us a 1-2 update
   * cadence even when the WebSocket is failing, AND keeps `lastFetchAt`
   * fresh so the offline banner stays hidden when the REST surface is
   * actually working.
   */
  useEffect(() => {
    if (!selectedTripId) return;
    const POLL_MS = 10_000;
    const id = setInterval(() => {
      void loadTripData(selectedTripId).catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [selectedTripId, loadTripData]);

  // Auto-track route visits: once a passenger has dwelled on a specific
  // trip for the visit-floor window (60 s), record the visit so it shows
  // up in their history + stats. We end the visit on cleanup so the
  // server can compute durationSeconds; visits below the floor are
  // pruned server-side.
  useEffect(() => {
    if (!selectedTripId) return;
    const trip = trips.find((t) => t.tripId === selectedTripId);
    if (!trip) return;

    let active = true;
    let visitId: string | null = null;
    const t = setTimeout(async () => {
      try {
        const id = await startRouteVisit({
          routeId: trip.routeId,
          tripId: selectedTripId,
        });
        if (!active) {
          if (id) void endRouteVisit(id).catch(() => undefined);
          return;
        }
        visitId = id;
      } catch {
        // History is best-effort.
      }
    }, 60_000);

    return () => {
      active = false;
      clearTimeout(t);
      if (visitId) void endRouteVisit(visitId).catch(() => undefined);
    };
  }, [selectedTripId, trips]);

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
      if (!next || !shouldApplyFix(next, latestLive.current)) return;
      setLiveSafe(next);
      setTripEnded(false);
      setConnectionStatus("connected");
      setIsStale(false);
      setLastFetchAt(new Date().toISOString());
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
      setPreTripPhase(null);
      clearStaleTimer();
    };
    const onPreStateChanged = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      const phase = str(payload?.preTripPhase);
      if (
        phase !== "AT_DEPOT" &&
        phase !== "APPROACHING_ORIGIN" &&
        phase !== "AT_ORIGIN"
      ) {
        return;
      }
      setPreTripPhase({
        phase,
        distanceToOriginMeters: num(payload?.distanceToOriginMeters),
        originArrivedAt: str(payload?.originArrivedAt),
        updatedAt:
          str(payload?.recordedAt) ?? new Date().toISOString(),
      });
      // Also keep the trips-array status in sync so other consumers see it.
      setTrips((prev) =>
        prev.map((t) =>
          t.tripId === tripId
            ? {
                ...t,
                preTripPhase: phase,
                originArrivedAt:
                  str(payload?.originArrivedAt) ?? t.originArrivedAt ?? null,
              }
            : t,
        ),
      );
    };
    const onTripStarted = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      // The PRE_TRIP trip just got promoted to RUNNING (server-side dwell
      // auto-start OR the driver tapped Start). Clear the phase banner.
      setPreTripPhase(null);
      setTripEnded(false);
      setTrips((prev) =>
        prev.map((t) =>
          t.tripId === tripId
            ? {
                ...t,
                status: "RUNNING",
                startedAt: str(payload?.startedAt) ?? t.startedAt,
                preTripPhase: null,
              }
            : t,
        ),
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("connect_error", onConnectError);
    socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, onLocation);
    socket.on(SOCKET_EVENTS.TRIP_ETA_UPDATED, onEta);
    socket.on(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, onStopArrival);
    socket.on(SOCKET_EVENTS.TRIP_ENDED, onTripEnded);
    socket.on(SOCKET_EVENTS.TRIP_PRE_STATE_CHANGED, onPreStateChanged);
    socket.on(SOCKET_EVENTS.TRIP_STARTED, onTripStarted);

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
      socket.off(SOCKET_EVENTS.TRIP_PRE_STATE_CHANGED, onPreStateChanged);
      socket.off(SOCKET_EVENTS.TRIP_STARTED, onTripStarted);
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
    lastFetchAt,
    tripEnded,
    passengerLocation,
    preTripPhase,
    selectTrip,
    retry,
  };
}
