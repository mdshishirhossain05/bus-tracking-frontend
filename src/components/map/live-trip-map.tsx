"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  OverlayView,
  OverlayViewF,
  PolylineF,
  TrafficLayer,
  useLoadScript,
} from "@react-google-maps/api";
import type { RoutePresentation } from "@/features/routes/types";
import type { PassengerLocation } from "@/types/trip";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants/map";
import { env } from "@/lib/config/env";
import { formatRelativeTime } from "@/lib/utils/format";

const LIVE_FOLLOW_ZOOM = 17;
const ROUTE_FIT_PADDING = 72;

const CAMERA_FOLLOW_THROTTLE_MS = 160;
const USER_INTERACTION_RESUME_HINT_MS = 2800;

const MIN_VISIBLE_MOVE_METERS = 3;
const STATIONARY_JITTER_METERS = 9;
const LOW_SPEED_JITTER_METERS = 7;
const NORMAL_CORRECTION_MAX_METERS = 45;
const LARGE_CORRECTION_MAX_METERS = 140;
const EXTREME_JUMP_METERS = 450;

const MIN_ANIMATION_MS = 650;
const BASE_ANIMATION_MS = 1200;
const LARGE_CORRECTION_ANIMATION_MS = 2200;
const MAX_ANIMATION_MS = 3200;

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  fullscreenControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  clickableIcons: true,
  gestureHandling: "greedy",
  zoomControl: true,
  cameraControl: false,
  scaleControl: true,
};

type LatLngPoint = google.maps.LatLngLiteral;

type InfoWindowState =
  | { type: "bus"; position: LatLngPoint }
  | { type: "passenger"; position: LatLngPoint }
  | { type: "origin"; position: LatLngPoint; label: string }
  | { type: "destination"; position: LatLngPoint; label: string }
  | { type: "stop"; id: string; position: LatLngPoint }
  | null;

interface LiveTripMapProps {
  latitude?: number | null;
  longitude?: number | null;
  routeName?: string | null;
  busLabel?: string | null;
  updatedAt?: string | null;
  speed?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  routePresentation?: RoutePresentation | null;
  passengerLocation?: PassengerLocation | null;
  highlightedStopId?: string | null;
  arrivedStopId?: string | null;
  autoFollow?: boolean;
}

function isValidCoordinate(latitude?: number | null, longitude?: number | null) {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function toLatLng(point: [number, number]): LatLngPoint {
  return {
    lat: point[0],
    lng: point[1],
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(start: LatLngPoint, end: LatLngPoint) {
  const earthRadius = 6_371_000;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(start.lat)) *
      Math.cos(toRadians(end.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function bearingDegrees(start: LatLngPoint, end: LatLngPoint) {
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const dLng = toRadians(end.lng - start.lng);

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

function interpolatePoint(start: LatLngPoint, end: LatLngPoint, t: number) {
  return {
    lat: lerp(start.lat, end.lat, t),
    lng: lerp(start.lng, end.lng, t),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Max distance from the route within which the bus marker is snapped to it. */
const ROUTE_SNAP_MAX_METERS = 55;

/**
 * Projects a raw GPS point onto the nearest point of the route polyline so
 * the bus marker rides cleanly on its road instead of wobbling with GPS
 * noise. If the bus is genuinely far off-route (beyond the threshold) the
 * raw point is kept, so a real detour is never hidden.
 */
function snapPointToRoute(
  point: LatLngPoint,
  path: LatLngPoint[],
): LatLngPoint {
  if (path.length < 2) return point;

  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((point.lat * Math.PI) / 180);
  const toXY = (p: LatLngPoint) => ({
    x: p.lng * mPerDegLng,
    y: p.lat * mPerDegLat,
  });

  const px = toXY(point);
  let best: LatLngPoint | null = null;
  let bestDistanceSq = Infinity;

  for (let i = 0; i < path.length - 1; i += 1) {
    const a = toXY(path[i]!);
    const b = toXY(path[i + 1]!);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;

    let t = 0;
    if (lengthSq > 0) {
      t = clamp(((px.x - a.x) * dx + (px.y - a.y) * dy) / lengthSq, 0, 1);
    }

    const projX = a.x + t * dx;
    const projY = a.y + t * dy;
    const distanceSq = (px.x - projX) ** 2 + (px.y - projY) ** 2;

    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      best = { lat: projY / mPerDegLat, lng: projX / mPerDegLng };
    }
  }

  if (!best) return point;
  return Math.sqrt(bestDistanceSq) <= ROUTE_SNAP_MAX_METERS ? best : point;
}

function fitMapToPoints(map: google.maps.Map | null, points: LatLngPoint[]) {
  if (!map || !points.length || typeof google === "undefined") return;

  if (points.length === 1) {
    map.panTo(points[0]);
    map.setZoom(DEFAULT_MAP_ZOOM);
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  points.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds, ROUTE_FIT_PADDING);
}

function formatSpeedText(speed?: number | null) {
  return typeof speed === "number" && Number.isFinite(speed)
    ? `${speed.toFixed(1)} km/h`
    : "Speed unavailable";
}

function formatEtaText(etaMinutes?: number | null) {
  return typeof etaMinutes === "number" && Number.isFinite(etaMinutes)
    ? `${etaMinutes} min`
    : "ETA unavailable";
}

function getAccuracyMeters(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getSpeedKmh(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getAnimationDurationMs(params: {
  distanceMeters: number;
  speedKmh?: number | null;
  accuracyM?: number | null;
  largeCorrection: boolean;
}) {
  const { distanceMeters, speedKmh, accuracyM, largeCorrection } = params;

  const speed = getSpeedKmh(speedKmh);
  const accuracy = getAccuracyMeters(accuracyM);

  if (largeCorrection) {
    return clamp(
      LARGE_CORRECTION_ANIMATION_MS + distanceMeters * 2.5,
      LARGE_CORRECTION_ANIMATION_MS,
      MAX_ANIMATION_MS,
    );
  }

  const speedFactor =
    speed != null && speed >= 8 ? clamp(28 / speed, 0.45, 1.45) : 1.15;

  const accuracyPenalty =
    accuracy != null && accuracy > 80
      ? 1.45
      : accuracy != null && accuracy > 50
        ? 1.25
        : 1;

  return clamp(
    (BASE_ANIMATION_MS + distanceMeters * 6) * speedFactor * accuracyPenalty,
    MIN_ANIMATION_MS,
    MAX_ANIMATION_MS,
  );
}

function getSmoothedTarget(params: {
  current: LatLngPoint;
  target: LatLngPoint;
  speed?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
}) {
  const { current, target, speed, accuracyM, isStationary } = params;

  const distanceMeters = haversineMeters(current, target);
  const currentSpeed = getSpeedKmh(speed);
  const accuracy = getAccuracyMeters(accuracyM);

  const jitterThreshold = isStationary
    ? Math.max(
        STATIONARY_JITTER_METERS,
        accuracy != null ? Math.min(accuracy * 0.28, 18) : 0,
      )
    : currentSpeed != null && currentSpeed < 6
      ? Math.max(
          LOW_SPEED_JITTER_METERS,
          accuracy != null ? Math.min(accuracy * 0.18, 14) : 0,
        )
      : Math.max(
          MIN_VISIBLE_MOVE_METERS,
          accuracy != null ? Math.min(accuracy * 0.08, 8) : 0,
        );

  if (distanceMeters < jitterThreshold) {
    return {
      target: current,
      distanceMeters,
      shouldAnimate: false,
      largeCorrection: false,
      extremeJump: false,
    };
  }

  if (distanceMeters >= EXTREME_JUMP_METERS) {
    return {
      target,
      distanceMeters,
      shouldAnimate: true,
      largeCorrection: false,
      extremeJump: true,
    };
  }

  if (distanceMeters > LARGE_CORRECTION_MAX_METERS) {
    const correctionRatio = LARGE_CORRECTION_MAX_METERS / distanceMeters;

    return {
      target: interpolatePoint(current, target, correctionRatio),
      distanceMeters,
      shouldAnimate: true,
      largeCorrection: true,
      extremeJump: false,
    };
  }

  if (distanceMeters > NORMAL_CORRECTION_MAX_METERS) {
    const correctionRatio = NORMAL_CORRECTION_MAX_METERS / distanceMeters;

    return {
      target: interpolatePoint(current, target, correctionRatio),
      distanceMeters,
      shouldAnimate: true,
      largeCorrection: true,
      extremeJump: false,
    };
  }

  return {
    target,
    distanceMeters,
    shouldAnimate: true,
    largeCorrection: false,
    extremeJump: false,
  };
}

function PinMarker({
  label,
  tone,
  size = 14,
  pulse = false,
  onClick,
}: {
  label: string;
  tone: "origin" | "destination" | "stop" | "next" | "arrived" | "passenger";
  size?: number;
  pulse?: boolean;
  onClick?: () => void;
}) {
  const colors = {
    origin: "#16a34a",
    destination: "#dc2626",
    stop: "#334155",
    next: "#f59e0b",
    arrived: "#10b981",
    passenger: "#2563eb",
  };

  const color = colors[tone];

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{ width: size + 12, height: size + 12 }}
    >
      {pulse ? (
        <span
          className="absolute rounded-full"
          style={{
            width: size + 14,
            height: size + 14,
            backgroundColor: color,
            opacity: 0.18,
            animation: "ubts-map-pulse 1.7s ease-out infinite",
          }}
        />
      ) : null}

      <span
        className="relative rounded-full border-[3px] border-white shadow-md"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    </button>
  );
}

function VehicleMarker({
  position,
  routeName,
  busLabel,
  updatedAt,
  speed,
  heading,
  visualHeading,
  isStationary,
  etaMinutes,
  nextStopName,
  onClick,
}: {
  position: LatLngPoint;
  routeName?: string | null;
  busLabel?: string | null;
  updatedAt?: string | null;
  speed?: number | null;
  heading?: number | null;
  visualHeading?: number | null;
  isStationary?: boolean;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  onClick?: () => void;
}) {
  const headingValue =
    typeof heading === "number" && Number.isFinite(heading)
      ? heading
      : visualHeading;

  const headingDeg =
    typeof headingValue === "number" && Number.isFinite(headingValue)
      ? Math.round(headingValue)
      : 0;

  return (
    <OverlayViewF
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Live bus location"
        className="flex -translate-x-1/2 -translate-y-[88%] flex-col items-center"
      >
        <div className="rounded-sm border border-white bg-slate-950/90 px-3 py-2 text-left text-white shadow-xl backdrop-blur">
          <p className="max-w-[170px] truncate text-xs font-semibold">
            {busLabel ?? "Live Bus"}
          </p>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-100">
            <span>{formatEtaText(etaMinutes)}</span>
            <span className="text-slate-500">•</span>
            <span>{formatSpeedText(speed)}</span>
          </div>

          {nextStopName ? (
            <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-300">
              Next: {nextStopName}
            </p>
          ) : null}
        </div>

        <div className="relative mt-2 flex h-8 w-8 items-center justify-center">
          {!isStationary ? (
            <span className="absolute h-8 w-8 animate-ping rounded-full bg-blue-500/25" />
          ) : null}

          <span className="relative flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-blue-600 shadow-lg">
            <span
              className="block h-0 w-0 border-x-[4px] border-b-[9px] border-x-transparent border-b-white transition-transform duration-300"
              style={{
                transform: `rotate(${headingDeg}deg)`,
                transformOrigin: "center",
              }}
            />
          </span>
        </div>

        <span className="sr-only">
          {routeName ?? "Route"} {updatedAt ? formatRelativeTime(updatedAt) : ""}
        </span>
      </button>
    </OverlayViewF>
  );
}

function AnimatedVehicleMarker({
  latitude,
  longitude,
  routeName,
  busLabel,
  updatedAt,
  speed,
  heading,
  accuracyM,
  isStationary,
  etaMinutes,
  nextStopName,
  onClick,
  onAnimatedPositionChange,
}: {
  latitude: number;
  longitude: number;
  routeName?: string | null;
  busLabel?: string | null;
  updatedAt?: string | null;
  speed?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  isStationary?: boolean;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  onClick?: (position: LatLngPoint) => void;
  onAnimatedPositionChange?: (position: LatLngPoint) => void;
}) {
  const [animatedPosition, setAnimatedPosition] = useState<LatLngPoint>({
    lat: latitude,
    lng: longitude,
  });

  const [visualHeading, setVisualHeading] = useState<number | null>(
    typeof heading === "number" && Number.isFinite(heading) ? heading : null,
  );

  const animatedPositionRef = useRef<LatLngPoint>({
    lat: latitude,
    lng: longitude,
  });

  const lastRawTargetRef = useRef<LatLngPoint>({
    lat: latitude,
    lng: longitude,
  });

  const frameRef = useRef<number | null>(null);

  // Latest packet fields kept in refs so a speed/accuracy/callback change does
  // NOT retrigger the animation effect. Only a genuine position change should
  // start a new tween — otherwise the effect cleanup cancels the in-flight
  // requestAnimationFrame and the marker visibly freezes.
  const speedRef = useRef(speed);
  const accuracyRef = useRef(accuracyM);
  const isStationaryRef = useRef(isStationary);
  const onAnimatedPositionChangeRef = useRef(onAnimatedPositionChange);

  useEffect(() => {
    speedRef.current = speed;
    accuracyRef.current = accuracyM;
    isStationaryRef.current = isStationary;
    onAnimatedPositionChangeRef.current = onAnimatedPositionChange;
  });

  useEffect(() => {
    const rawTarget = { lat: latitude, lng: longitude };
    const previousRawTarget = lastRawTargetRef.current;

    if (
      previousRawTarget.lat === rawTarget.lat &&
      previousRawTarget.lng === rawTarget.lng
    ) {
      return;
    }

    lastRawTargetRef.current = rawTarget;

    const start = animatedPositionRef.current;
    const smoothing = getSmoothedTarget({
      current: start,
      target: rawTarget,
      speed: speedRef.current,
      accuracyM: accuracyRef.current,
      isStationary: isStationaryRef.current,
    });

    if (!smoothing.shouldAnimate) {
      return;
    }

    const target = smoothing.target;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (smoothing.extremeJump) {
      animatedPositionRef.current = target;
      setAnimatedPosition(target);
      onAnimatedPositionChangeRef.current?.(target);
      return;
    }

    const movementBearing = bearingDegrees(start, target);
    if (Number.isFinite(movementBearing)) {
      setVisualHeading(movementBearing);
    }

    const durationMs = getAnimationDurationMs({
      distanceMeters: haversineMeters(start, target),
      speedKmh: speedRef.current,
      accuracyM: accuracyRef.current,
      largeCorrection: smoothing.largeCorrection,
    });

    const startedAt = performance.now();

    const tick = (now: number) => {
      const raw = Math.min((now - startedAt) / durationMs, 1);
      const eased =
        raw < 0.5
          ? 4 * raw * raw * raw
          : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      const next = {
        lat: lerp(start.lat, target.lat, eased),
        lng: lerp(start.lng, target.lng, eased),
      };

      animatedPositionRef.current = next;
      setAnimatedPosition(next);
      onAnimatedPositionChangeRef.current?.(next);

      if (raw < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [latitude, longitude]);

  // Cancel any in-flight animation only when the marker unmounts.
  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof heading === "number" && Number.isFinite(heading)) {
      setVisualHeading(heading);
    }
  }, [heading]);

  return (
    <VehicleMarker
      position={animatedPosition}
      routeName={routeName}
      busLabel={busLabel}
      updatedAt={updatedAt}
      speed={speed}
      heading={heading}
      visualHeading={visualHeading}
      isStationary={isStationary}
      etaMinutes={etaMinutes}
      nextStopName={nextStopName}
      onClick={() => onClick?.(animatedPosition)}
    />
  );
}

export default function LiveTripMap({
  latitude,
  longitude,
  routeName,
  busLabel,
  updatedAt,
  speed,
  heading,
  accuracyM,
  isStationary,
  etaMinutes,
  nextStopName,
  routePresentation,
  passengerLocation,
  highlightedStopId,
  arrivedStopId,
  autoFollow = true,
}: LiveTripMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const fittedRouteKeyRef = useRef<string | null>(null);
  const lastCameraFollowAtRef = useRef(0);
  const suppressNextInteractionRef = useRef(false);
  const resumeHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialCenterRef = useRef<LatLngPoint>({
    lat: DEFAULT_MAP_CENTER[0],
    lng: DEFAULT_MAP_CENTER[1],
  });

  const [infoWindow, setInfoWindow] = useState<InfoWindowState>(null);
  const [followEnabled, setFollowEnabled] = useState(autoFollow);
  const [showResumeHint, setShowResumeHint] = useState(false);

  const hasGoogleKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;
  const hasVehiclePosition = isValidCoordinate(latitude, longitude);

  const livePoint = useMemo<LatLngPoint | null>(() => {
    if (!hasVehiclePosition) return null;
    return { lat: latitude!, lng: longitude! };
  }, [hasVehiclePosition, latitude, longitude]);

  const passengerPoint = useMemo<LatLngPoint | null>(() => {
    if (!passengerLocation) return null;
    return {
      lat: passengerLocation.latitude,
      lng: passengerLocation.longitude,
    };
  }, [passengerLocation]);

  const stopPoints = useMemo<LatLngPoint[]>(() => {
    return (
      routePresentation?.stops?.map((stop) => ({
        lat: stop.latitude,
        lng: stop.longitude,
      })) ?? []
    );
  }, [routePresentation?.stops]);

  const routePath = useMemo<LatLngPoint[]>(() => {
    const savedGoogleRoadPath =
      routePresentation?.polyline?.map(toLatLng).filter((point) => {
        return isValidCoordinate(point.lat, point.lng);
      }) ?? [];

    return savedGoogleRoadPath.length >= 2 ? savedGoogleRoadPath : [];
  }, [routePresentation?.polyline]);

  const hasSavedGoogleRoadRoute = routePath.length >= 2;

  // The bus marker is snapped onto the route polyline for a precise,
  // jitter-free position; raw GPS is kept if the bus is far off-route.
  const snappedVehiclePoint = useMemo<LatLngPoint | null>(() => {
    if (!livePoint) return null;
    if (routePath.length < 2) return livePoint;
    return snapPointToRoute(livePoint, routePath);
  }, [livePoint, routePath]);

  const staticRouteBoundsPoints = useMemo<LatLngPoint[]>(() => {
    const points: LatLngPoint[] = [];

    points.push(...(hasSavedGoogleRoadRoute ? routePath : stopPoints));

    if (routePresentation?.origin) {
      points.push({
        lat: routePresentation.origin.latitude,
        lng: routePresentation.origin.longitude,
      });
    }

    if (routePresentation?.destination) {
      points.push({
        lat: routePresentation.destination.latitude,
        lng: routePresentation.destination.longitude,
      });
    }

    return points;
  }, [hasSavedGoogleRoadRoute, routePath, routePresentation, stopPoints]);

  const visibleBoundsPoints = useMemo<LatLngPoint[]>(() => {
    const points = [...staticRouteBoundsPoints];

    if (livePoint) points.push(livePoint);
    if (passengerPoint) points.push(passengerPoint);

    return points;
  }, [livePoint, passengerPoint, staticRouteBoundsPoints]);

  const routeFitKey = useMemo(() => {
    if (!routePresentation?.routeId) return "no-route";

    return [
      routePresentation.routeId,
      routePresentation.polyline?.length ?? 0,
      routePresentation.stops?.length ?? 0,
      routePresentation.origin?.id ?? "no-origin",
      routePresentation.destination?.id ?? "no-destination",
    ].join(":");
  }, [routePresentation]);

  const pauseFollowForUserInteraction = useCallback(() => {
    if (!followEnabled) return;

    setFollowEnabled(false);
    setShowResumeHint(true);

    if (resumeHintTimerRef.current) {
      clearTimeout(resumeHintTimerRef.current);
    }

    resumeHintTimerRef.current = setTimeout(() => {
      setShowResumeHint(false);
    }, USER_INTERACTION_RESUME_HINT_MS);
  }, [followEnabled]);

  const markProgrammaticCameraMove = useCallback(() => {
    suppressNextInteractionRef.current = true;

    window.setTimeout(() => {
      suppressNextInteractionRef.current = false;
    }, 250);
  }, []);

  const resumeFollowToBus = useCallback(() => {
    if (!livePoint) return;

    const map = mapRef.current;
    if (!map) return;

    setFollowEnabled(true);
    setShowResumeHint(false);
    markProgrammaticCameraMove();

    map.panTo(livePoint);
    map.setZoom(Math.max(map.getZoom() ?? DEFAULT_MAP_ZOOM, LIVE_FOLLOW_ZOOM));
  }, [livePoint, markProgrammaticCameraMove]);

  const followAnimatedVehicle = useCallback(
    (position: LatLngPoint) => {
      if (!autoFollow || !followEnabled) return;

      const map = mapRef.current;
      if (!map) return;

      const now = performance.now();
      if (now - lastCameraFollowAtRef.current < CAMERA_FOLLOW_THROTTLE_MS) {
        return;
      }

      lastCameraFollowAtRef.current = now;
      markProgrammaticCameraMove();

      map.panTo(position);

      const currentZoom = map.getZoom() ?? DEFAULT_MAP_ZOOM;
      if (currentZoom < LIVE_FOLLOW_ZOOM) {
        map.setZoom(LIVE_FOLLOW_ZOOM);
      }
    },
    [autoFollow, followEnabled, markProgrammaticCameraMove],
  );

  useEffect(() => {
    setFollowEnabled(autoFollow);
  }, [autoFollow]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (fittedRouteKeyRef.current === routeFitKey) return;

    fittedRouteKeyRef.current = routeFitKey;
    markProgrammaticCameraMove();

    if (staticRouteBoundsPoints.length > 1) {
      fitMapToPoints(map, staticRouteBoundsPoints);
      return;
    }

    if (livePoint) {
      map.panTo(livePoint);
      map.setZoom(LIVE_FOLLOW_ZOOM);
      return;
    }

    if (passengerPoint) {
      map.panTo(passengerPoint);
      map.setZoom(DEFAULT_MAP_ZOOM);
    }
  }, [
    isLoaded,
    livePoint,
    markProgrammaticCameraMove,
    passengerPoint,
    routeFitKey,
    staticRouteBoundsPoints,
  ]);

  useEffect(() => {
    return () => {
      if (resumeHintTimerRef.current) {
        clearTimeout(resumeHintTimerRef.current);
      }
    };
  }, []);

  if (!hasGoogleKey) {
    return (
      <div className="flex h-[620px] w-full items-center justify-center rounded-sm border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-amber-950">
            Google Maps API key is missing
          </p>
          <p className="mt-2 text-sm text-amber-300">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the frontend environment and
            redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[620px] w-full items-center justify-center rounded-sm border border-red-500/30 bg-red-500/10 p-6 text-center">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-red-950">
            Google Maps failed to load
          </p>
          <p className="mt-2 text-sm text-red-300">
            Check billing, API restrictions, Maps JavaScript API, and website
            referrer settings.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[620px] w-full items-center justify-center rounded-sm border border-slate-800 bg-slate-800 p-6">
        <p className="text-sm font-medium text-slate-400">
          Loading Google Maps...
        </p>
      </div>
    );
  }

  const activeStop =
    infoWindow?.type === "stop"
      ? routePresentation?.stops?.find((stop) => stop.id === infoWindow.id)
      : null;

  return (
    <div className="relative h-[620px] w-full overflow-hidden rounded-sm border border-slate-800 bg-slate-800">
      <style jsx global>{`
        @keyframes ubts-map-pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.9);
            opacity: 0;
          }
          100% {
            transform: scale(1.9);
            opacity: 0;
          }
        }
      `}</style>

      {!hasSavedGoogleRoadRoute && stopPoints.length >= 2 ? (
        <div className="absolute left-3 top-3 z-10 max-w-[300px] rounded-sm border border-amber-500/30 bg-slate-900/95 px-4 py-3 text-xs leading-5 text-amber-300 shadow-sm backdrop-blur">
          Google road route is not available yet. Save this route once from
          Admin → Route Stops to generate the road-following path.
        </div>
      ) : null}

      {showResumeHint && livePoint ? (
        <div className="absolute bottom-4 left-1/2 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-sm border border-slate-800 bg-slate-900/95 px-4 py-3 text-center text-xs text-slate-300 shadow-lg backdrop-blur">
          Auto-follow paused while you explore the map. Tap{" "}
          <span className="font-semibold">Track bus</span> to follow again.
        </div>
      ) : null}

      <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2">
        {livePoint ? (
          <button
            type="button"
            onClick={resumeFollowToBus}
            className={`rounded-full border px-3 py-2 text-xs font-medium shadow-sm backdrop-blur ${
              followEnabled
                ? "border-blue-500/30 bg-blue-500/10/95 text-blue-300"
                : "border-slate-800 bg-slate-900/95 text-slate-300"
            }`}
          >
            {followEnabled ? "Tracking bus" : "Track bus"}
          </button>
        ) : null}

        {visibleBoundsPoints.length > 1 ? (
          <button
            type="button"
            onClick={() => {
              setFollowEnabled(false);
              setShowResumeHint(false);
              markProgrammaticCameraMove();
              fitMapToPoints(mapRef.current, visibleBoundsPoints);
            }}
            className="rounded-full border border-slate-800 bg-slate-900/95 px-3 py-2 text-xs font-medium text-slate-300 shadow-sm backdrop-blur"
          >
            Fit route
          </button>
        ) : null}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenterRef.current}
        zoom={DEFAULT_MAP_ZOOM}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onUnmount={() => {
          mapRef.current = null;
          fittedRouteKeyRef.current = null;
        }}
        onDragStart={pauseFollowForUserInteraction}
        onZoomChanged={() => {
          if (!mapRef.current) return;

          if (suppressNextInteractionRef.current) {
            return;
          }

          pauseFollowForUserInteraction();
        }}
      >
        <TrafficLayer />

        {hasSavedGoogleRoadRoute ? (
          <>
            <PolylineF
              path={routePath}
              options={{
                strokeColor: "#ffffff",
                strokeOpacity: 1,
                strokeWeight: 9,
                geodesic: false,
                zIndex: 1,
              }}
            />
            <PolylineF
              path={routePath}
              options={{
                strokeColor: "#1a73e8",
                strokeOpacity: 0.95,
                strokeWeight: 6,
                geodesic: false,
                zIndex: 2,
              }}
            />
          </>
        ) : null}

        {routePresentation?.origin ? (
          <OverlayViewF
            position={{
              lat: routePresentation.origin.latitude,
              lng: routePresentation.origin.longitude,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PinMarker
              tone="origin"
              size={18}
              label="Origin"
              onClick={() =>
                setInfoWindow({
                  type: "origin",
                  label: routePresentation.origin?.name ?? "Origin",
                  position: {
                    lat: routePresentation.origin!.latitude,
                    lng: routePresentation.origin!.longitude,
                  },
                })
              }
            />
          </OverlayViewF>
        ) : null}

        {routePresentation?.destination ? (
          <OverlayViewF
            position={{
              lat: routePresentation.destination.latitude,
              lng: routePresentation.destination.longitude,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PinMarker
              tone="destination"
              size={18}
              label="Destination"
              onClick={() =>
                setInfoWindow({
                  type: "destination",
                  label: routePresentation.destination?.name ?? "Destination",
                  position: {
                    lat: routePresentation.destination!.latitude,
                    lng: routePresentation.destination!.longitude,
                  },
                })
              }
            />
          </OverlayViewF>
        ) : null}

        {routePresentation?.stops?.map((stop) => {
          const isArrived = arrivedStopId === stop.id;
          const isNext = !isArrived && highlightedStopId === stop.id;

          return (
            <OverlayViewF
              key={stop.id}
              position={{
                lat: stop.latitude,
                lng: stop.longitude,
              }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <PinMarker
                tone={isArrived ? "arrived" : isNext ? "next" : "stop"}
                size={isArrived || isNext ? 15 : 10}
                pulse={isArrived || isNext}
                label={stop.name}
                onClick={() =>
                  setInfoWindow({
                    type: "stop",
                    id: stop.id,
                    position: {
                      lat: stop.latitude,
                      lng: stop.longitude,
                    },
                  })
                }
              />
            </OverlayViewF>
          );
        })}

        {passengerPoint ? (
          <OverlayViewF
            position={passengerPoint}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PinMarker
              tone="passenger"
              size={16}
              pulse
              label="Your location"
              onClick={() =>
                setInfoWindow({
                  type: "passenger",
                  position: passengerPoint,
                })
              }
            />
          </OverlayViewF>
        ) : null}

        {hasVehiclePosition && snappedVehiclePoint ? (
          <AnimatedVehicleMarker
            latitude={snappedVehiclePoint.lat}
            longitude={snappedVehiclePoint.lng}
            routeName={routeName}
            busLabel={busLabel}
            updatedAt={updatedAt}
            speed={speed}
            heading={heading}
            accuracyM={accuracyM}
            isStationary={isStationary}
            etaMinutes={etaMinutes}
            nextStopName={nextStopName}
            onAnimatedPositionChange={followAnimatedVehicle}
            onClick={(position) =>
              setInfoWindow({
                type: "bus",
                position,
              })
            }
          />
        ) : null}

        {infoWindow ? (
          <InfoWindowF
            position={infoWindow.position}
            onCloseClick={() => setInfoWindow(null)}
          >
            <div className="min-w-[220px] space-y-1 text-sm">
              {infoWindow.type === "bus" ? (
                <>
                  <p className="font-semibold text-slate-100">
                    {busLabel ?? "Live Bus"}
                  </p>
                  <p className="text-slate-400">
                    {routeName ?? "Active route"}
                  </p>
                  <p className="text-slate-400">
                    {formatEtaText(etaMinutes)} • {formatSpeedText(speed)}
                  </p>
                  {nextStopName ? (
                    <p className="text-slate-400">Next: {nextStopName}</p>
                  ) : null}
                  <p className="text-slate-500">
                    {updatedAt ? formatRelativeTime(updatedAt) : "No update yet"}
                  </p>
                </>
              ) : null}

              {infoWindow.type === "passenger" ? (
                <>
                  <p className="font-semibold text-slate-100">Your location</p>
                  <p className="text-slate-400">
                    Accuracy:{" "}
                    {passengerLocation?.accuracyM != null
                      ? `${Math.round(passengerLocation.accuracyM)} m`
                      : "N/A"}
                  </p>
                </>
              ) : null}

              {infoWindow.type === "origin" ? (
                <>
                  <p className="font-semibold text-slate-100">Starting point</p>
                  <p className="text-slate-400">{infoWindow.label}</p>
                </>
              ) : null}

              {infoWindow.type === "destination" ? (
                <>
                  <p className="font-semibold text-slate-100">Destination</p>
                  <p className="text-slate-400">{infoWindow.label}</p>
                </>
              ) : null}

              {infoWindow.type === "stop" && activeStop ? (
                <>
                  <p className="font-semibold text-slate-100">
                    {activeStop.name}
                  </p>
                  <p className="text-slate-400">Stop #{activeStop.order}</p>
                  {highlightedStopId === activeStop.id ? (
                    <p className="text-amber-400">Next / nearest stop</p>
                  ) : null}
                  {arrivedStopId === activeStop.id ? (
                    <p className="text-emerald-400">Recently reached</p>
                  ) : null}
                </>
              ) : null}
            </div>
          </InfoWindowF>
        ) : null}
      </GoogleMap>
    </div>
  );
}