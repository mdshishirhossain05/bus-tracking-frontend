import { api, unwrap } from "@ubts/shared";
import { API_ENDPOINTS } from "@ubts/shared";
import type { FavoriteRoute, RouteLiveBus } from "@ubts/shared";

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

function normalizeFavorite(raw: any): FavoriteRoute {
  return {
    id: asString(raw?.id) ?? asString(raw?.routeId) ?? "",
    routeId: asString(raw?.routeId) ?? "",
    routeName: asString(raw?.routeName ?? raw?.route?.routeName) ?? "Route",
    description: asString(raw?.description ?? raw?.route?.description),
    isActive: typeof raw?.isActive === "boolean" ? raw.isActive : undefined,
    favoritedAt: asString(raw?.favoritedAt ?? raw?.createdAt),
  };
}

function extractItems(payload: any): any[] {
  const data = unwrap<any>(payload);
  const items = data?.items ?? data;
  return Array.isArray(items) ? items : [];
}

export async function getFavorites(): Promise<FavoriteRoute[]> {
  const res = await api.get(API_ENDPOINTS.passenger.favorites);
  return extractItems(res.data).map(normalizeFavorite);
}

export async function addFavorite(routeId: string): Promise<FavoriteRoute[]> {
  const res = await api.post(API_ENDPOINTS.passenger.favorites, { routeId });
  return extractItems(res.data).map(normalizeFavorite);
}

export async function removeFavorite(routeId: string): Promise<FavoriteRoute[]> {
  const res = await api.delete(API_ENDPOINTS.passenger.favorite(routeId));
  return extractItems(res.data).map(normalizeFavorite);
}

function normalizeLiveBus(raw: any): RouteLiveBus {
  const live = raw?.live ?? raw;
  const eta = raw?.eta ?? {};
  return {
    tripId: asString(raw?.tripId ?? raw?.id) ?? "",
    routeId: asString(raw?.routeId) ?? "",
    busId: asString(raw?.busId ?? raw?.bus?.id),
    busLabel: asString(
      raw?.busLabel ??
        raw?.bus?.busCode ??
        raw?.bus?.plateNumber ??
        raw?.bus?.label,
    ),
    driverId: asString(raw?.driverId ?? raw?.driver?.id),
    driverName: asString(raw?.driverName ?? raw?.driver?.fullName),
    status: asString(raw?.status) ?? "RUNNING",
    latitude: asNumber(live?.latitude ?? live?.lat),
    longitude: asNumber(live?.longitude ?? live?.lng),
    speedKmh: asNumber(live?.displaySpeedKmh ?? live?.speedKmh ?? live?.speed),
    avgSpeedKmh: asNumber(
      eta?.rollingAverageSpeedKmh ??
        live?.averageSpeedKmh ??
        live?.rollingAverageSpeedKmh,
    ),
    heading: asNumber(live?.heading),
    etaMinutes: asNumber(eta?.etaMinutes ?? eta?.minutes),
    nextStopName: asString(
      eta?.nextStopName ?? eta?.nextStop?.stopName ?? eta?.nextStop,
    ),
    nextStopDistanceMeters: asNumber(eta?.nextStopDistanceMeters),
    nearestStopName: asString(eta?.nearestStopName),
    finalStopReached:
      typeof eta?.finalStopReached === "boolean" ? eta.finalStopReached : false,
    confidence: asString(eta?.confidence),
    stopEtas: Array.isArray(eta?.stopEtas)
      ? eta.stopEtas
          .map((e: any) => ({
            stopId: asString(e?.stopId) ?? "",
            stopName: asString(e?.stopName),
            stopOrder: asNumber(e?.stopOrder),
            etaMinutes: asNumber(e?.etaMinutes),
            distanceMeters: asNumber(e?.distanceMeters),
          }))
          .filter((e: { stopId: string }) => Boolean(e.stopId))
      : undefined,
    sourceType: asString(live?.sourceType),
    sourceLabel: asString(live?.source ?? live?.sourceLabel),
    sourceStatus: asString(live?.sourceStatus),
    updatedAt: asString(live?.updatedAt ?? live?.recordedAt),
    isStale:
      typeof (live?.isStale ?? raw?.isStale) === "boolean"
        ? (live?.isStale ?? raw?.isStale)
        : undefined,
  };
}

export async function getRouteLiveBuses(
  routeId: string,
): Promise<RouteLiveBus[]> {
  const res = await api.get(API_ENDPOINTS.passenger.routeLiveBuses(routeId));
  const data = unwrap<any>(res.data);
  const list = Array.isArray(data)
    ? data
    : (data?.activeTrips ??
        data?.buses ??
        data?.items ??
        data?.trips ??
        []);
  return (Array.isArray(list) ? list : [])
    .map(normalizeLiveBus)
    .filter((b: RouteLiveBus) => Boolean(b.tripId));
}
