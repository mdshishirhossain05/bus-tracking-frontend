"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import {
  endTrip,
  sendDriverLocation,
  startTrip,
} from "@/features/driver/api/driver.api";
import { useDriverCurrentTrip } from "@/features/driver/hooks/use-driver-current-trip";
import type {
  DriverTrackingSelectionReason,
  DriverTrackingSourceStatus,
  DriverTrackingSourceSummary,
  DriverTrackingSourceType,
  DriverTripControlStatus,
  LocationPermissionState,
  PublishState,
  StartReadinessStage,
} from "@/features/driver/types";
import type { LiveBusLocation } from "@/types/trip";
import type { TripStopArrivalPayload } from "@/types/socket";

type DriverLocationPublishPayload = {
  lat: number;
  lng: number;
  recordedAt: string;
  speedKmh?: number;
  heading?: number;
  accuracyM?: number;
};

type DriverEndedContext = {
  tripId: string;
  routeId: string | null;
  routeName: string | null;
  busId: string | null;
  busLabel: string | null;
  endedAt: string | null;
  reasonLabel: string;
  wasExternal: boolean;
};

type WakeLockState =
  | "unsupported"
  | "inactive"
  | "requesting"
  | "active"
  | "released"
  | "error";

type WakeLockSentinelLike = {
  released?: boolean;
  release: () => Promise<void>;
  addEventListener?: (
    type: "release",
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener?: (type: "release", listener: () => void) => void;
};

const BACKEND_MIN_INTERVAL_MS = 1000;
const DEFAULT_MOVING_INTERVAL_MS = 1000;
const DEFAULT_STATIONARY_INTERVAL_MS = 4000;
const HEARTBEAT_INTERVAL_MS = 10000;
const MANUAL_SEND_GUARD_MS = 1000;

const MAX_ACCEPTABLE_ACCURACY_M = 120;
const START_BOOTSTRAP_ACCEPTABLE_ACCURACY_M = 220;

const WATCH_TIMEOUT_MS = 12000;
const WATCH_MAX_AGE_MS = 0;
const WATCH_RESTART_DELAY_MS = 1800;

const START_FIX_TIMEOUT_MS = 30000;
const START_FIX_SINGLE_ATTEMPT_TIMEOUT_MS = 10000;
const START_FIX_MAX_AGE_MS = 1000;
const PERMISSION_PROMPT_TIMEOUT_MS = 15000;

const ARRIVAL_EVENT_VISIBILITY_MS = 20_000;

const POSITION_FRESHNESS_MS = 12_000;
const TRUSTED_BROWSER_SPEED_MAX_ACCURACY_M = 50;
const MIN_BROWSER_SPEED_TO_REPORT_KMH = 2;

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function sanitizeHeading(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value)) return undefined;

  const normalized = Math.round(value);
  if (normalized < 0 || normalized > 360) return undefined;

  return normalized;
}

function sanitizeAccuracy(
  value: number | null | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value) || value < 0) return undefined;

  return value;
}

function sanitizeSpeedKmh(
  value: number | null | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value) || value < 0) return undefined;

  return value;
}

function getPositionAccuracy(position: GeolocationPosition) {
  return typeof position.coords.accuracy === "number"
    ? position.coords.accuracy
    : Number.POSITIVE_INFINITY;
}

function isPositionAccurateEnough(
  position: GeolocationPosition,
  threshold = MAX_ACCEPTABLE_ACCURACY_M,
) {
  return getPositionAccuracy(position) <= threshold;
}

function isPositionFresh(
  position: GeolocationPosition,
  maxAgeMs = POSITION_FRESHNESS_MS,
) {
  return Date.now() - position.timestamp <= maxAgeMs;
}

function shouldTrustBrowserSpeed(
  position: GeolocationPosition,
  speedKmh: number,
) {
  const accuracyM = getPositionAccuracy(position);

  return (
    Number.isFinite(speedKmh) &&
    speedKmh >= MIN_BROWSER_SPEED_TO_REPORT_KMH &&
    accuracyM <= TRUSTED_BROWSER_SPEED_MAX_ACCURACY_M
  );
}

function buildLocationPayload(
  position: GeolocationPosition,
): DriverLocationPublishPayload {
  const payload: DriverLocationPublishPayload = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    recordedAt: new Date(position.timestamp).toISOString(),
  };

  const rawBrowserSpeedKmh =
    typeof position.coords.speed === "number" && position.coords.speed >= 0
      ? position.coords.speed * 3.6
      : null;

  const heading =
    typeof position.coords.heading === "number" && position.coords.heading >= 0
      ? position.coords.heading
      : null;

  const accuracy = position.coords.accuracy ?? null;

  const safeSpeed = sanitizeSpeedKmh(rawBrowserSpeedKmh);
  const safeHeading = sanitizeHeading(heading);
  const safeAccuracy = sanitizeAccuracy(accuracy);

  if (safeSpeed !== undefined && shouldTrustBrowserSpeed(position, safeSpeed)) {
    payload.speedKmh = safeSpeed;
  }

  if (safeHeading !== undefined) payload.heading = safeHeading;
  if (safeAccuracy !== undefined) payload.accuracyM = safeAccuracy;

  return payload;
}

function normalizeSourceType(value: unknown): DriverTrackingSourceType | null {
  return value === "DRIVER_MOBILE" || value === "GPS_DEVICE" ? value : null;
}

function normalizeSourceStatus(
  value: unknown,
): DriverTrackingSourceStatus | null {
  return value === "HEALTHY" ||
    value === "STALE" ||
    value === "UNHEALTHY" ||
    value === "DISCONNECTED"
    ? value
    : null;
}

function normalizeSelectionReason(
  value: unknown,
): DriverTrackingSelectionReason | null {
  return value === "DRIVER_ONLY" ||
    value === "GPS_ONLY" ||
    value === "GPS_PRIORITY" ||
    value === "DRIVER_PRIORITY" ||
    value === "GPS_FALLBACK_TO_DRIVER" ||
    value === "DRIVER_FALLBACK_TO_GPS" ||
    value === "MOST_RECENT_HEALTHY" ||
    value === "NO_HEALTHY_SOURCE"
    ? value
    : null;
}

function mapBackendTrackingSource(
  trip: any,
): DriverTrackingSourceSummary | null {
  const live = trip?.liveState;
  if (!live) return null;

  return {
    sourceType: normalizeSourceType(live.sourceType),
    sourceStatus: normalizeSourceStatus(live.sourceStatus),
    selectionReason: normalizeSelectionReason(live.selectionReason),
    sourceLabel: asString(live.source ?? live.sourceLabel),
  };
}

function getPreferredDisplaySpeedFromLive(live: any) {
  if (live?.isStationary === true) return 0;

  const displaySpeed = asNumber(live?.displaySpeedKmh);
  const normalSpeed = asNumber(live?.speed ?? live?.speedKmh);
  const filteredSpeed = asNumber(live?.filteredSpeedKmh ?? live?.speedKmh);
  const averageSpeed = asNumber(
    live?.averageSpeedKmh ?? live?.rollingAverageSpeedKmh,
  );
  const rawSpeed = asNumber(live?.rawSpeedKmh);

  return (
    displaySpeed ?? normalSpeed ?? filteredSpeed ?? averageSpeed ?? rawSpeed
  );
}

function mapBackendLiveStateToFrontend(trip: any): LiveBusLocation | null {
  if (!trip?.tripId || !trip?.liveState) return null;

  const live = trip.liveState;
  const latitude = asNumber(live.latitude ?? live.lat);
  const longitude = asNumber(live.longitude ?? live.lng);

  if (latitude == null || longitude == null) return null;

  const preferredSpeed = getPreferredDisplaySpeedFromLive(live);

  return {
    tripId: trip.tripId,
    routeId: trip.routeId,
    busId: trip.busId,
    driverId: trip.driverId,
    latitude,
    longitude,
    speed: preferredSpeed,
    filteredSpeedKmh: asNumber(live.filteredSpeedKmh ?? live.speedKmh),
    rawSpeedKmh: asNumber(live.rawSpeedKmh),
    averageSpeedKmh: asNumber(
      live.averageSpeedKmh ?? live.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: preferredSpeed,
    heading: asNumber(live.heading),
    accuracyM: asNumber(live.accuracyM),
    isStationary:
      typeof live.isStationary === "boolean" ? live.isStationary : undefined,
    distanceDeltaMeters: asNumber(live.distanceDeltaMeters),
    elapsedSeconds: asNumber(live.elapsedSeconds),
    source: asString(live.source),
    updatedAt:
      asString(live.updatedAt ?? live.recordedAt) ??
      trip.startedAt ??
      new Date().toISOString(),
  };
}

function mapSocketLocationPayloadToLiveState(
  payload: any,
): LiveBusLocation | null {
  const tripId = asString(payload?.tripId);
  const routeId = asString(payload?.routeId);
  const latitude = asNumber(payload?.latitude ?? payload?.lat);
  const longitude = asNumber(payload?.longitude ?? payload?.lng);

  if (!tripId || !routeId || latitude == null || longitude == null) {
    return null;
  }

  const preferredSpeed = getPreferredDisplaySpeedFromLive(payload);

  return {
    tripId,
    routeId,
    busId: asString(payload?.busId),
    driverId: asString(payload?.driverId),
    latitude,
    longitude,
    speed: preferredSpeed,
    filteredSpeedKmh: asNumber(payload?.filteredSpeedKmh ?? payload?.speedKmh),
    rawSpeedKmh: asNumber(payload?.rawSpeedKmh),
    averageSpeedKmh: asNumber(
      payload?.averageSpeedKmh ?? payload?.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: preferredSpeed,
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

function mapSocketTrackingSource(
  payload: any,
): DriverTrackingSourceSummary | null {
  return {
    sourceType: normalizeSourceType(payload?.sourceType),
    sourceStatus: normalizeSourceStatus(payload?.sourceStatus),
    selectionReason: normalizeSelectionReason(payload?.selectionReason),
    sourceLabel: asString(payload?.source ?? payload?.sourceLabel),
  };
}

function getApiErrorCode(error: any): string | null {
  return (
    error?.response?.data?.code ??
    error?.response?.data?.error?.code ??
    error?.code ??
    null
  );
}

function getApiErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Failed to publish driver location."
  );
}

function getGeoErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied by browser or device settings.";
    case error.POSITION_UNAVAILABLE:
      return "GPS signal is temporarily unavailable. Trying to recover...";
    case error.TIMEOUT:
      return "GPS response timed out. Retrying automatically...";
    default:
      return "Live GPS is temporarily unavailable. Retrying automatically...";
  }
}

function getEndedReasonLabel(payload: any) {
  const endReason = asString(payload?.endReason);
  const endMode = asString(payload?.endMode);

  if (endReason === "MANUAL_DRIVER") return "You ended this trip";
  if (endReason === "MANUAL_ADMIN") return "Trip ended by admin operations";
  if (endReason === "AUTO_FINAL_STOP_ARRIVAL") {
    return "Trip ended automatically at final stop";
  }
  if (endReason === "AUTO_FINAL_STOP_STATIONARY") {
    return "Trip ended automatically after final-stop inactivity";
  }
  if (endReason === "AUTO_TELEMETRY_TIMEOUT") {
    return "Trip ended automatically after telemetry timeout";
  }
  if (endReason === "SYSTEM_STALE_TIMEOUT") {
    return "Trip ended automatically after stale timeout";
  }

  if (endMode === "MANUAL_ADMIN") return "Trip ended by admin operations";
  if (endMode === "AUTO_TELEMATICS") return "Trip ended automatically";
  if (endMode === "SYSTEM") return "Trip ended by system safety control";

  return "Trip ended";
}

function wasExternalEnd(payload: any) {
  const endReason = asString(payload?.endReason);
  const endMode = asString(payload?.endMode);

  return !(endReason === "MANUAL_DRIVER" || endMode === "MANUAL_DRIVER");
}

function buildEndedContextFromTrip(
  trip: any,
  payload?: any,
): DriverEndedContext {
  return {
    tripId: asString(payload?.tripId) ?? trip?.tripId ?? "",
    routeId: asString(payload?.routeId) ?? trip?.routeId ?? null,
    routeName: asString(trip?.routeName) ?? null,
    busId: asString(payload?.busId) ?? trip?.busId ?? null,
    busLabel: asString(trip?.busLabel) ?? null,
    endedAt:
      asString(payload?.endedAt) ??
      asString(trip?.endedAt ?? trip?.endTime) ??
      new Date().toISOString(),
    reasonLabel: getEndedReasonLabel(payload),
    wasExternal: payload ? wasExternalEnd(payload) : false,
  };
}

async function queryBrowserPermissionState(): Promise<LocationPermissionState> {
  if (!("geolocation" in navigator)) {
    return "unsupported";
  }

  if (!("permissions" in navigator) || !navigator.permissions?.query) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "geolocation",
    } as PermissionDescriptor);

    if (result.state === "granted") return "granted";
    if (result.state === "denied") return "denied";

    return "prompt";
  } catch {
    return "unknown";
  }
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

function requestPermissionInteractively(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This device/browser does not support geolocation."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (geoError) => {
        reject(new Error(getGeoErrorMessage(geoError)));
      },
      {
        enableHighAccuracy: true,
        timeout: PERMISSION_PROMPT_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  });
}

function requestSingleHighAccuracyFix(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (geoError) => reject(new Error(getGeoErrorMessage(geoError))),
      {
        enableHighAccuracy: true,
        timeout: START_FIX_SINGLE_ATTEMPT_TIMEOUT_MS,
        maximumAge: START_FIX_MAX_AGE_MS,
      },
    );
  });
}

function supportsWakeLock() {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

async function requestScreenWakeLock(): Promise<WakeLockSentinelLike | null> {
  if (!supportsWakeLock()) return null;

  const nav = navigator as Navigator & {
    wakeLock?: {
      request: (type: "screen") => Promise<WakeLockSentinelLike>;
    };
  };

  if (!nav.wakeLock?.request) return null;

  return nav.wakeLock.request("screen");
}

export function useDriverTripControl() {
  const {
    loading: currentTripLoading,
    refreshing: currentTripRefreshing,
    trip,
    error: currentTripError,
    refresh,
    silentRefresh,
  } = useDriverCurrentTrip();

  const [status, setStatus] = useState<DriverTripControlStatus>("idle");
  const [permission, setPermission] =
    useState<LocationPermissionState>("unknown");
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [publishIntervalMs, setPublishIntervalMs] = useState(
    DEFAULT_MOVING_INTERVAL_MS,
  );
  const [liveState, setLiveState] = useState<LiveBusLocation | null>(null);
  const [trackingSource, setTrackingSource] =
    useState<DriverTrackingSourceSummary | null>(null);
  const [recentArrival, setRecentArrival] =
    useState<TripStopArrivalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittingStart, setSubmittingStart] = useState(false);
  const [submittingEnd, setSubmittingEnd] = useState(false);
  const [startReadinessStage, setStartReadinessStage] =
    useState<StartReadinessStage>("idle");
  const [lastEndedContext, setLastEndedContext] =
    useState<DriverEndedContext | null>(null);
  const [wakeLockState, setWakeLockState] = useState<WakeLockState>("inactive");

  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const joinedTripIdRef = useRef<string | null>(null);
  const arrivalVisibilityTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const latestPositionRef = useRef<GeolocationPosition | null>(null);
  const lastPositionSeenAtRef = useRef<number>(0);
  const publishInFlightRef = useRef(false);
  const lastPublishedAtRef = useRef<number>(0);
  const lastPublishedRecordedAtRef = useRef<string | null>(null);
  const lastManualSentAtRef = useRef<number>(0);

  const startedRef = useRef(false);
  const activeTripIdRef = useRef<string | null>(null);
  const tripRef = useRef<any>(null);
  const refreshRef = useRef(refresh);
  const silentRefreshRef = useRef(silentRefresh);
  const publishIntervalRef = useRef(DEFAULT_MOVING_INTERVAL_MS);
  const liveStationaryRef = useRef<boolean>(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const started = trip?.status === "RUNNING";

  useEffect(() => {
    tripRef.current = trip ?? null;
    startedRef.current = trip?.status === "RUNNING";
    activeTripIdRef.current = trip?.tripId ?? null;
  }, [trip]);

  useEffect(() => {
    refreshRef.current = refresh;
    silentRefreshRef.current = silentRefresh;
  }, [refresh, silentRefresh]);

  useEffect(() => {
    publishIntervalRef.current = publishIntervalMs;
  }, [publishIntervalMs]);

  useEffect(() => {
    liveStationaryRef.current = Boolean(liveState?.isStationary);
  }, [liveState?.isStationary]);

  useEffect(() => {
    const backendLiveState = mapBackendLiveStateToFrontend(trip);
    const backendTrackingSource = mapBackendTrackingSource(trip);

    setLiveState((current) => {
      if (backendLiveState) return backendLiveState;

      if (
        trip?.status === "RUNNING" &&
        current?.tripId &&
        current.tripId === trip.tripId
      ) {
        return current;
      }

      return null;
    });

    setTrackingSource((current) => {
      if (backendTrackingSource) return backendTrackingSource;

      if (trip?.status === "RUNNING" && current) {
        return current;
      }

      return null;
    });
  }, [trip]);

  useEffect(() => {
    setError(currentTripError || null);
  }, [currentTripError]);

  useEffect(() => {
    if (!trip) {
      setStatus((prev) => (prev === "ended" ? prev : "idle"));
      setPublishState("idle");
      setRecentArrival(null);
      setTrackingSource(null);
      return;
    }

    if (trip.status === "PLANNED") {
      setStatus("idle");
      setPublishState("idle");
      return;
    }

    if (trip.status === "RUNNING") {
      setStatus("active");
      return;
    }

    setStatus("ended");
    setPublishState("idle");
    setLastEndedContext(buildEndedContextFromTrip(trip));
  }, [trip]);

  useEffect(() => {
    let mounted = true;

    void queryBrowserPermissionState().then((state) => {
      if (!mounted) return;
      setPermission(state);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearPublishLoop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearWatchRestart = useCallback(() => {
    if (watchRestartTimerRef.current) {
      clearTimeout(watchRestartTimerRef.current);
      watchRestartTimerRef.current = null;
    }
  }, []);

  const clearArrivalVisibilityTimer = useCallback(() => {
    if (arrivalVisibilityTimerRef.current) {
      clearTimeout(arrivalVisibilityTimerRef.current);
      arrivalVisibilityTimerRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const currentWakeLock = wakeLockRef.current;
    wakeLockRef.current = null;

    if (!currentWakeLock) {
      setWakeLockState(supportsWakeLock() ? "inactive" : "unsupported");
      return;
    }

    try {
      if (!currentWakeLock.released) {
        await currentWakeLock.release();
      }
      setWakeLockState("released");
    } catch {
      setWakeLockState("error");
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if (!supportsWakeLock()) {
      setWakeLockState("unsupported");
      return;
    }

    if (document.visibilityState !== "visible") {
      setWakeLockState("released");
      return;
    }

    if (wakeLockRef.current && !wakeLockRef.current.released) {
      setWakeLockState("active");
      return;
    }

    try {
      setWakeLockState("requesting");
      const sentinel = await requestScreenWakeLock();

      if (!sentinel) {
        setWakeLockState("unsupported");
        return;
      }

      const handleRelease = () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
        setWakeLockState("released");
      };

      sentinel.addEventListener?.("release", handleRelease, { once: true });
      wakeLockRef.current = sentinel;
      setWakeLockState("active");
    } catch {
      setWakeLockState("error");
    }
  }, []);

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

  const resetPublisherState = useCallback(() => {
    publishInFlightRef.current = false;
    lastPublishedAtRef.current = 0;
    lastPublishedRecordedAtRef.current = null;
    lastManualSentAtRef.current = 0;
    lastPositionSeenAtRef.current = 0;
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      setError("This device/browser does not support geolocation.");
      return;
    }

    try {
      const position = await requestPermissionInteractively();
      latestPositionRef.current = position;
      lastPositionSeenAtRef.current = Date.now();
      setPermission("granted");
      setError(null);
    } catch (err: any) {
      const latestPermission = await queryBrowserPermissionState();
      setPermission(latestPermission);

      setError(
        err?.message ||
          "Location access is blocked in browser or device settings. Please enable GPS permission and try again.",
      );
    }
  }, []);

  const acquireStartReadyPosition =
    useCallback(async (): Promise<GeolocationPosition> => {
      if (!("geolocation" in navigator)) {
        setPermission("unsupported");
        throw new Error("This device/browser does not support geolocation.");
      }

      const permissionState = await queryBrowserPermissionState();
      setPermission(permissionState);

      if (permissionState === "denied") {
        throw new Error(
          "Location access is blocked in browser or device settings. Please enable GPS permission and try again.",
        );
      }

      let initialPosition: GeolocationPosition | null =
        latestPositionRef.current;

      if (!initialPosition) {
        initialPosition = await requestPermissionInteractively();
        latestPositionRef.current = initialPosition;
        lastPositionSeenAtRef.current = Date.now();
        setPermission("granted");
      }

      if (
        initialPosition &&
        isPositionAccurateEnough(
          initialPosition,
          START_BOOTSTRAP_ACCEPTABLE_ACCURACY_M,
        )
      ) {
        setError(null);
        return initialPosition;
      }

      const deadline = Date.now() + START_FIX_TIMEOUT_MS;
      let bestPosition = initialPosition;
      let bestAccuracy = initialPosition
        ? getPositionAccuracy(initialPosition)
        : Number.POSITIVE_INFINITY;

      while (Date.now() < deadline) {
        try {
          const nextPosition = await requestSingleHighAccuracyFix();
          latestPositionRef.current = nextPosition;
          lastPositionSeenAtRef.current = Date.now();
          setPermission("granted");

          const accuracy = getPositionAccuracy(nextPosition);

          if (accuracy < bestAccuracy) {
            bestPosition = nextPosition;
            bestAccuracy = accuracy;
          }

          if (accuracy <= START_BOOTSTRAP_ACCEPTABLE_ACCURACY_M) {
            setError(null);
            return nextPosition;
          }

          setError(
            `Waiting for a stronger GPS fix (${Math.round(
              accuracy,
            )}m accuracy). Keep GPS on and stay in a more open area.`,
          );
        } catch (err: any) {
          setError(
            err?.message ||
              "Live GPS is temporarily unavailable. Retrying automatically...",
          );
        }
      }

      if (bestPosition) {
        setError(
          `Starting with reduced GPS quality (${Math.round(
            bestAccuracy,
          )}m accuracy). Live tracking will continue improving after trip start.`,
        );
        return bestPosition;
      }

      throw new Error(
        "Unable to get a usable GPS position. Move to an open area, turn on device location, and try again.",
      );
    }, []);

  const shouldPublishPosition = useCallback(
    (position: GeolocationPosition, mode: "auto" | "manual") => {
      const now = Date.now();

      if (!isPositionFresh(position)) {
        return false;
      }

      if (mode === "manual") {
        return now - lastManualSentAtRef.current >= MANUAL_SEND_GUARD_MS;
      }

      const sinceLastPublish = now - lastPublishedAtRef.current;
      const accuracyOk = isPositionAccurateEnough(position);

      const desiredCadence =
        accuracyOk && liveStationaryRef.current
          ? DEFAULT_STATIONARY_INTERVAL_MS
          : publishIntervalRef.current;

      const cadenceTarget = Math.max(desiredCadence, BACKEND_MIN_INTERVAL_MS);

      if (lastPublishedAtRef.current === 0) {
        return true;
      }

      if (sinceLastPublish >= cadenceTarget) {
        return true;
      }

      if (sinceLastPublish >= HEARTBEAT_INTERVAL_MS) {
        return true;
      }

      return false;
    },
    [],
  );

  const publishLatestPosition = useCallback(
    async (mode: "auto" | "manual" = "auto") => {
      const activeTripId = activeTripIdRef.current;
      const currentTrip = tripRef.current;

      if (
        !currentTrip ||
        !activeTripId ||
        currentTrip.tripId !== activeTripId ||
        !startedRef.current ||
        !latestPositionRef.current
      ) {
        return false;
      }

      if (publishInFlightRef.current) return false;

      const position = latestPositionRef.current;
      const payload = buildLocationPayload(position);

      if (!isPositionFresh(position)) {
        setPublishState("recovering");
        setError("Waiting for a fresh GPS update before publishing.");
        return false;
      }

      if (
        lastPublishedRecordedAtRef.current &&
        payload.recordedAt <= lastPublishedRecordedAtRef.current
      ) {
        setPublishState((prev) => (prev === "idle" ? "watching" : prev));
        return false;
      }

      if (!shouldPublishPosition(position, mode)) {
        setPublishState((prev) => (prev === "idle" ? "watching" : prev));
        return false;
      }

      try {
        publishInFlightRef.current = true;
        setPublishState("sending");

        const response = await sendDriverLocation(activeTripId, payload);

        const serverLiveState = mapBackendLiveStateToFrontend({
          tripId: activeTripId,
          routeId: currentTrip.routeId,
          busId: currentTrip.busId,
          driverId: currentTrip.driverId,
          liveState: response?.liveState ?? null,
          startedAt: currentTrip.startedAt,
        });

        const apiArrival = normalizeStopArrivalPayload(
          response?.arrival ?? null,
        );

        if (apiArrival) {
          showRecentArrival(apiArrival);
        }

        const sourceSummary = mapBackendTrackingSource({
          liveState: response?.liveState ?? null,
        });

        const now = Date.now();

        lastPublishedAtRef.current = now;
        lastPublishedRecordedAtRef.current = payload.recordedAt;

        if (mode === "manual") {
          lastManualSentAtRef.current = now;
        }

        if (serverLiveState) {
          setLiveState(serverLiveState);
        }

        if (sourceSummary) {
          setTrackingSource(sourceSummary);
        }

        setPublishState("success");
        setError(null);
        return true;
      } catch (err: any) {
        const code = getApiErrorCode(err);
        const message = getApiErrorMessage(err);

        if (code === "RATE_LIMITED" || code === "STALE_TIMESTAMP") {
          setPublishState((prev) => (prev === "idle" ? "watching" : prev));
          return false;
        }

        console.error(err);
        setPublishState("error");
        setError(message);
        return false;
      } finally {
        publishInFlightRef.current = false;
      }
    },
    [shouldPublishPosition, showRecentArrival],
  );

  const scheduleNextPublish = useCallback(() => {
    clearPublishLoop();

    if (!startedRef.current || !activeTripIdRef.current) return;

    const delay = Math.max(
      liveStationaryRef.current
        ? DEFAULT_STATIONARY_INTERVAL_MS
        : publishIntervalRef.current,
      BACKEND_MIN_INTERVAL_MS,
    );

    timeoutRef.current = setTimeout(async () => {
      await publishLatestPosition("auto");
      scheduleNextPublish();
    }, delay);
  }, [clearPublishLoop, publishLatestPosition]);

  const startWatchingLocation = useCallback(() => {
    if (!startedRef.current || !activeTripIdRef.current) return;

    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      setError("This device/browser does not support geolocation.");
      return;
    }

    clearWatch();
    clearWatchRestart();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        latestPositionRef.current = position;
        lastPositionSeenAtRef.current = Date.now();
        setPermission("granted");
        setPublishState((prev) => {
          if (prev === "idle" || prev === "recovering" || prev === "error") {
            return "watching";
          }

          return prev;
        });
        setError(null);
        void publishLatestPosition("auto");
      },
      (geoError) => {
        console.error(geoError);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setPermission("denied");
          setPublishState("error");
          setError(getGeoErrorMessage(geoError));
          clearWatch();
          return;
        }

        setPermission((prev) =>
          prev === "unknown"
            ? "prompt"
            : prev === "denied"
              ? "denied"
              : "granted",
        );
        setPublishState("recovering");
        setError(getGeoErrorMessage(geoError));

        clearWatch();
        clearWatchRestart();

        watchRestartTimerRef.current = setTimeout(() => {
          startWatchingLocation();
        }, WATCH_RESTART_DELAY_MS);
      },
      {
        enableHighAccuracy: true,
        timeout: WATCH_TIMEOUT_MS,
        maximumAge: WATCH_MAX_AGE_MS,
      },
    );
  }, [clearWatch, clearWatchRestart, publishLatestPosition]);

  const handleStartTrip = useCallback(async () => {
    if (!trip || (!trip.canStart && trip.status !== "PLANNED")) {
      setError("No planned trip is available to start.");
      return;
    }

    try {
      setSubmittingStart(true);
      setStatus("preparing");
      setStartReadinessStage("checking");
      setError(null);

      const currentPermission = await queryBrowserPermissionState();
      setPermission(currentPermission);

      if (currentPermission !== "granted") {
        setStartReadinessStage("requesting_permission");
      }

      setStartReadinessStage("acquiring_fix");
      const startPosition = await acquireStartReadyPosition();
      latestPositionRef.current = startPosition;
      lastPositionSeenAtRef.current = Date.now();

      setStartReadinessStage("starting_trip");
      setStatus("starting");

      await startTrip();
      await refresh();

      resetPublisherState();
      latestPositionRef.current = startPosition;
      lastPositionSeenAtRef.current = Date.now();
      setRecentArrival(null);
      setStatus("active");
      setStartReadinessStage("idle");
      setError(null);
      setLastEndedContext(null);
      void acquireWakeLock();
    } catch (err: any) {
      console.error(err);

      const latestPermission = await queryBrowserPermissionState();
      setPermission(latestPermission);

      setStatus("error");
      setStartReadinessStage("idle");
      setError(
        err?.response?.data?.message || err?.message || "Failed to start trip.",
      );
    } finally {
      setSubmittingStart(false);
    }
  }, [
    trip,
    refresh,
    resetPublisherState,
    acquireStartReadyPosition,
    acquireWakeLock,
  ]);

  const handleEndTrip = useCallback(async () => {
    if (!trip?.tripId) {
      setError("No running trip is available to end.");
      return;
    }

    try {
      setSubmittingEnd(true);
      setStatus("ending");

      await endTrip(trip.tripId);

      clearWatch();
      clearPublishLoop();
      clearWatchRestart();
      clearArrivalVisibilityTimer();
      await releaseWakeLock();
      latestPositionRef.current = null;
      resetPublisherState();

      setLastEndedContext({
        ...buildEndedContextFromTrip(trip, {
          tripId: trip.tripId,
          routeId: trip.routeId,
          busId: trip.busId,
          endReason: "MANUAL_DRIVER",
          endMode: "MANUAL_DRIVER",
          endedAt: new Date().toISOString(),
        }),
        wasExternal: false,
      });

      await refresh();

      setStatus("ended");
      setPublishState("idle");
      setStartReadinessStage("idle");
      setError(null);
      setLiveState(null);
      setTrackingSource(null);
      setRecentArrival(null);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setError(err?.response?.data?.message || "Failed to end trip.");
    } finally {
      setSubmittingEnd(false);
    }
  }, [
    trip,
    clearWatch,
    clearPublishLoop,
    clearWatchRestart,
    clearArrivalVisibilityTimer,
    refresh,
    resetPublisherState,
    releaseWakeLock,
  ]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!startedRef.current) return;

      if (document.visibilityState === "visible") {
        void acquireWakeLock();
        startWatchingLocation();
        void publishLatestPosition("auto");
        scheduleNextPublish();
      } else {
        setWakeLockState("released");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    acquireWakeLock,
    publishLatestPosition,
    scheduleNextPublish,
    startWatchingLocation,
  ]);

  useEffect(() => {
    const tripId = trip?.tripId;
    if (!tripId) return;

    const socket = connectSocket();

    const joinCurrentTrip = () => {
      if (joinedTripIdRef.current && joinedTripIdRef.current !== tripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, {
          tripId: joinedTripIdRef.current,
        });
      }

      socket.emit(SOCKET_EVENTS.JOIN_TRIP, { tripId });
      joinedTripIdRef.current = tripId;
    };

    const handleConnect = () => {
      joinCurrentTrip();
    };

    const handleTripStarted = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      void silentRefreshRef.current();
    };

    const handleLocationUpdated = (payload: any) => {
      if (payload?.tripId !== tripId) return;

      const normalized = mapSocketLocationPayloadToLiveState(payload);

      if (normalized) {
        setLiveState(normalized);
        setTrackingSource(mapSocketTrackingSource(payload));
        setPublishState("success");
        setError(null);
      }
    };

    const handleEtaUpdated = (payload: any) => {
      if (payload?.tripId !== tripId) return;
    };

    const handleStopArrival = (payload: any) => {
      if (payload?.tripId !== tripId) return;

      const normalizedArrival = normalizeStopArrivalPayload(payload);
      if (!normalizedArrival) return;

      showRecentArrival(normalizedArrival);
    };

    const handleTripEnded = (payload: any) => {
      if (payload?.tripId !== tripId) return;

      const latestTrip = tripRef.current;

      clearWatch();
      clearPublishLoop();
      clearWatchRestart();
      clearArrivalVisibilityTimer();
      void releaseWakeLock();
      latestPositionRef.current = null;
      resetPublisherState();

      setLastEndedContext(buildEndedContextFromTrip(latestTrip, payload));

      setPublishState("idle");
      setStatus("ended");
      setStartReadinessStage("idle");
      setLiveState(null);
      setTrackingSource(null);
      setRecentArrival(null);

      void refreshRef.current();
    };

    socket.on("connect", handleConnect);
    socket.on(SOCKET_EVENTS.TRIP_STARTED, handleTripStarted);
    socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, handleLocationUpdated);
    socket.on(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleEtaUpdated);
    socket.on(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, handleStopArrival);
    socket.on(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      if (joinedTripIdRef.current === tripId) {
        socket.emit(SOCKET_EVENTS.LEAVE_TRIP, {
          tripId,
        });
        joinedTripIdRef.current = null;
      }

      socket.off("connect", handleConnect);
      socket.off(SOCKET_EVENTS.TRIP_STARTED, handleTripStarted);
      socket.off(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, handleLocationUpdated);
      socket.off(SOCKET_EVENTS.TRIP_ETA_UPDATED, handleEtaUpdated);
      socket.off(SOCKET_EVENTS.TRIP_STOP_ARRIVAL, handleStopArrival);
      socket.off(SOCKET_EVENTS.TRIP_ENDED, handleTripEnded);
    };
  }, [
    trip?.tripId,
    clearWatch,
    clearPublishLoop,
    clearWatchRestart,
    clearArrivalVisibilityTimer,
    releaseWakeLock,
    resetPublisherState,
    showRecentArrival,
  ]);

  useEffect(() => {
    if (!started || !trip?.tripId) {
      clearWatch();
      clearPublishLoop();
      clearWatchRestart();
      clearArrivalVisibilityTimer();
      void releaseWakeLock();
      resetPublisherState();
      return;
    }

    void acquireWakeLock();
    startWatchingLocation();
    void publishLatestPosition("auto");
    scheduleNextPublish();

    return () => {
      clearPublishLoop();
      clearWatch();
      clearWatchRestart();
      clearArrivalVisibilityTimer();
      resetPublisherState();
    };
  }, [
    started,
    trip?.tripId,
    clearWatch,
    clearPublishLoop,
    clearWatchRestart,
    clearArrivalVisibilityTimer,
    resetPublisherState,
    startWatchingLocation,
    scheduleNextPublish,
    publishLatestPosition,
    acquireWakeLock,
    releaseWakeLock,
  ]);

  useEffect(() => {
    if (started && trip?.tripId) {
      scheduleNextPublish();
    }
  }, [publishIntervalMs, started, trip?.tripId, scheduleNextPublish]);

  useEffect(() => {
    return () => {
      clearWatch();
      clearPublishLoop();
      clearWatchRestart();
      clearArrivalVisibilityTimer();
      void releaseWakeLock();
      resetPublisherState();
    };
  }, [
    clearWatch,
    clearPublishLoop,
    clearWatchRestart,
    clearArrivalVisibilityTimer,
    releaseWakeLock,
    resetPublisherState,
  ]);

  return {
    loading: currentTripLoading && !trip,
    refreshing: currentTripRefreshing,
    error,
    trip,
    status,
    started,
    permission,
    publishState,
    publishIntervalMs,
    liveState,
    trackingSource,
    recentArrival,
    submittingStart,
    submittingEnd,
    startReadinessStage,
    lastEndedContext,
    wakeLockState,
    clearEndedContext: () => setLastEndedContext(null),
    setPublishIntervalMs,
    requestPermission,
    refreshTrip: refresh,
    startTrip: handleStartTrip,
    endTrip: handleEndTrip,
    sendNow: () => publishLatestPosition("manual"),
  };
}
