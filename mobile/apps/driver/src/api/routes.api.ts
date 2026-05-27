import { api, unwrap, API_ENDPOINTS } from "@ubts/shared";
import type { RoutePresentation, RouteStop } from "@ubts/shared";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const x = Number(value);
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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
        .map((stop: any, i: number) => normalizeStop(stop, i))
        .filter((stop: RouteStop | null): stop is RouteStop => stop != null)
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
    origin: raw.origin ? normalizeStop(raw.origin, 0) : (stops[0] ?? null),
    destination: raw.destination
      ? normalizeStop(raw.destination, stops.length - 1)
      : (stops[stops.length - 1] ?? null),
  };
}

export async function getRoutePresentation(
  routeId: string,
): Promise<RoutePresentation | null> {
  const res = await api.get(API_ENDPOINTS.routes.presentation(routeId));
  return normalizeRoutePresentation(unwrap(res.data));
}
