import { api, unwrap } from "@ubts/shared";
import { API_ENDPOINTS } from "@ubts/shared";
import type {
  ActiveTrip,
  LiveBusLocation,
  RoutePresentation,
  RouteStop,
  ScheduleTodayItem,
  ScheduleTodayStatus,
  TripEta,
  TripPreTripPhaseValue,
} from "@ubts/shared";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizePhase(value: unknown): ActiveTrip["preTripPhase"] {
  const raw = asString(value);
  if (
    raw === "AT_DEPOT" ||
    raw === "APPROACHING_ORIGIN" ||
    raw === "AT_ORIGIN"
  ) {
    return raw;
  }
  return null;
}

function normalizeActiveTrip(raw: any): ActiveTrip {
  return {
    tripId: asString(raw?.tripId ?? raw?.id) ?? "",
    routeId: asString(raw?.routeId) ?? "",
    routeName: asString(raw?.routeName),
    busId: asString(raw?.busId),
    busLabel: asString(raw?.busLabel ?? raw?.busName),
    driverId: asString(raw?.driverId),
    driverName: asString(raw?.driverName),
    status: asString(raw?.status) ?? "RUNNING",
    startedAt: asString(raw?.startedAt ?? raw?.startTime),
    isStale: typeof raw?.isStale === "boolean" ? raw.isStale : undefined,
    preTripPhase: normalizePhase(raw?.preTripPhase),
    preTripStartedAt: asString(raw?.preTripStartedAt),
    originArrivedAt: asString(raw?.originArrivedAt),
  };
}

function normalizeLiveBusLocation(raw: any): LiveBusLocation | null {
  if (!raw) return null;
  const latitude = asNumber(raw.latitude ?? raw.lat);
  const longitude = asNumber(raw.longitude ?? raw.lng);
  const tripId = asString(raw.tripId);
  const routeId = asString(raw.routeId);
  if (latitude == null || longitude == null || !tripId || !routeId) return null;

  const displaySpeed =
    asNumber(raw.displaySpeedKmh) ?? asNumber(raw.speed ?? raw.speedKmh);

  return {
    tripId,
    routeId,
    busId: asString(raw.busId),
    driverId: asString(raw.driverId),
    latitude,
    longitude,
    speed: displaySpeed,
    filteredSpeedKmh: asNumber(raw.filteredSpeedKmh ?? raw.speedKmh),
    averageSpeedKmh: asNumber(
      raw.averageSpeedKmh ?? raw.rollingAverageSpeedKmh,
    ),
    displaySpeedKmh: displaySpeed,
    heading: asNumber(raw.heading),
    accuracyM: asNumber(raw.accuracyM),
    isStationary:
      typeof raw.isStationary === "boolean" ? raw.isStationary : undefined,
    source: asString(raw.source),
    updatedAt:
      asString(raw.updatedAt ?? raw.recordedAt) ?? new Date().toISOString(),
  };
}

function normalizeTripEta(raw: any): TripEta | null {
  if (!raw) return null;
  const root = raw.eta ?? raw;
  return {
    tripId: asString(raw.tripId ?? root.tripId) ?? "",
    etaMinutes: asNumber(root.etaMinutes),
    nextStopName: asString(root.nextStopName ?? root.nextStop?.stopName),
    nextStopDistanceMeters:
      asNumber(root.nextStopDistanceMeters) ??
      asNumber(root.nextStop?.distanceMeters),
    nearestStopName: asString(root.nearestStopName ?? root.nearestStop?.stopName),
    rollingAverageSpeedKmh: asNumber(root.rollingAverageSpeedKmh),
    confidence:
      root.confidence === "HIGH" ||
      root.confidence === "MEDIUM" ||
      root.confidence === "LOW"
        ? root.confidence
        : null,
    finalStopReached:
      typeof root.finalStopReached === "boolean" ? root.finalStopReached : false,
    updatedAt: asString(raw.updatedAt ?? raw.recordedAt ?? root.updatedAt),
  };
}

function normalizeStop(raw: any, index: number): RouteStop | null {
  const latitude = asNumber(raw?.latitude ?? raw?.lat);
  const longitude = asNumber(raw?.longitude ?? raw?.lng);
  if (latitude == null || longitude == null) return null;
  return {
    id: asString(raw?.id ?? raw?.stopId) ?? `stop-${index}`,
    name: asString(raw?.name ?? raw?.stopName) ?? `Stop ${index + 1}`,
    latitude,
    longitude,
    order: asNumber(raw?.order ?? raw?.stopOrder) ?? index,
  };
}

function normalizeRoutePresentation(raw: any): RoutePresentation | null {
  if (!raw) return null;
  const routeId = asString(raw.routeId ?? raw.id);
  if (!routeId) return null;

  const stops = Array.isArray(raw.stops)
    ? raw.stops
        .map((s: any, i: number) => normalizeStop(s, i))
        .filter((s: RouteStop | null): s is RouteStop => s != null)
    : [];

  const polyline: [number, number][] = Array.isArray(raw.polyline)
    ? raw.polyline
        .map((point: any): [number, number] | null => {
          const lat = asNumber(Array.isArray(point) ? point[0] : point?.lat);
          const lng = asNumber(Array.isArray(point) ? point[1] : point?.lng);
          return lat != null && lng != null ? [lat, lng] : null;
        })
        .filter((p: [number, number] | null): p is [number, number] => p != null)
    : [];

  return {
    routeId,
    routeName: asString(raw.routeName) ?? "Route",
    polyline,
    stops,
    origin: raw.origin ? normalizeStop(raw.origin, 0) : stops[0] ?? null,
    destination: raw.destination
      ? normalizeStop(raw.destination, stops.length - 1)
      : stops[stops.length - 1] ?? null,
  };
}

export async function getActiveTrips(): Promise<ActiveTrip[]> {
  const res = await api.get(API_ENDPOINTS.passenger.activeTrips);
  const raw =
    res.data?.trips ?? res.data?.data?.trips ?? unwrap<unknown>(res.data);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeActiveTrip).filter((t) => Boolean(t.tripId));
}

export async function getLiveTripState(
  tripId: string,
): Promise<LiveBusLocation | null> {
  const res = await api.get(API_ENDPOINTS.passenger.liveTripState(tripId));
  return normalizeLiveBusLocation(unwrap(res.data));
}

export async function getTripEta(tripId: string): Promise<TripEta | null> {
  try {
    const res = await api.get(API_ENDPOINTS.passenger.tripEta(tripId));
    return normalizeTripEta(unwrap(res.data));
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function getRoutePresentation(
  routeId: string,
): Promise<RoutePresentation | null> {
  const res = await api.get(API_ENDPOINTS.routes.presentation(routeId));
  return normalizeRoutePresentation(unwrap(res.data));
}

function normalizeScheduleStatus(value: unknown): ScheduleTodayStatus {
  return value === "PRE_TRIP" || value === "RUNNING" || value === "ENDED"
    ? value
    : "PLANNED";
}

function normalizeSchedulePhase(
  value: unknown,
): TripPreTripPhaseValue | null {
  return value === "AT_DEPOT" ||
    value === "APPROACHING_ORIGIN" ||
    value === "AT_ORIGIN"
    ? value
    : null;
}

function normalizeScheduleItem(raw: any): ScheduleTodayItem | null {
  const scheduleId = asString(raw?.scheduleId);
  const routeId = asString(raw?.routeId);
  if (!scheduleId || !routeId) return null;
  const rawTrip = raw?.trip;
  return {
    scheduleId,
    routeId,
    routeName: asString(raw?.routeName) ?? "Route",
    busId: asString(raw?.busId) ?? "",
    busLabel: asString(raw?.busLabel) ?? "",
    driverId: asString(raw?.driverId),
    driverName: asString(raw?.driverName),
    departureTime: asString(raw?.departureTime) ?? "",
    departureAtIso: asString(raw?.departureAtIso) ?? new Date().toISOString(),
    notes: asString(raw?.notes),
    isFavorite: raw?.isFavorite === true,
    trip: rawTrip
      ? {
          id: asString(rawTrip.id) ?? "",
          status: normalizeScheduleStatus(rawTrip.status),
          preTripPhase: normalizeSchedulePhase(rawTrip.preTripPhase),
          startedAt: asString(rawTrip.startedAt),
          endedAt: asString(rawTrip.endedAt),
          lastEtaMinutes: asNumber(rawTrip.lastEtaMinutes),
          nextStopName: asString(rawTrip.nextStopName),
        }
      : null,
  };
}

export async function getSchedulesToday(): Promise<ScheduleTodayItem[]> {
  const res = await api.get(API_ENDPOINTS.passenger.schedulesToday);
  const data = unwrap<{ items: unknown[] }>(res.data);
  const raw = Array.isArray(data?.items) ? data.items : [];
  return raw
    .map(normalizeScheduleItem)
    .filter((s): s is ScheduleTodayItem => s !== null);
}
