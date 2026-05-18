import type { RoutePresentation, RouteStop } from "@/features/routes/types";

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeStop(input: any, fallbackOrder = 0): RouteStop {
  const rawStop = input?.stop ?? input;

  return {
    id: asString(input?.stopId ?? rawStop?.id ?? input?.id),
    name:
      asString(
        rawStop?.name ?? rawStop?.stopName ?? input?.name ?? input?.stopName,
      ) || "Unknown Stop",
    latitude:
      asNumber(
        rawStop?.latitude ?? rawStop?.lat ?? input?.latitude ?? input?.lat,
      ) ?? 0,
    longitude:
      asNumber(
        rawStop?.longitude ?? rawStop?.lng ?? input?.longitude ?? input?.lng,
      ) ?? 0,
    order: asNumber(input?.order ?? input?.stopOrder) ?? fallbackOrder,
  };
}

function normalizePolylinePoint(point: any): [number, number] | null {
  if (Array.isArray(point) && point.length === 2) {
    const lat = asNumber(point[0]);
    const lng = asNumber(point[1]);

    if (lat == null || lng == null) return null;
    return [lat, lng];
  }

  const lat = asNumber(point?.lat ?? point?.latitude);
  const lng = asNumber(point?.lng ?? point?.longitude);

  if (lat == null || lng == null) return null;
  return [lat, lng];
}

function normalizePolyline(raw: any): [number, number][] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizePolylinePoint)
    .filter((point): point is [number, number] => point != null);
}

function pickPolyline(input: any): [number, number][] {
  const candidates = [
    input?.polyline,
    input?.geometry,
    input?.route?.geometry?.polyline,
    input?.route?.geometry,
    input?.data?.polyline,
    input?.data?.geometry,
    input?.data?.route?.geometry?.polyline,
    input?.data?.route?.geometry,
  ];

  for (const candidate of candidates) {
    const normalized = normalizePolyline(candidate);

    if (normalized.length >= 2) {
      return normalized;
    }
  }

  return [];
}

function pickStops(input: any): RouteStop[] {
  const rawStops =
    input?.stops ??
    input?.routeStops ??
    input?.route?.stops ??
    input?.route?.routeStops ??
    input?.data?.stops ??
    input?.data?.routeStops ??
    input?.data?.route?.stops ??
    input?.data?.route?.routeStops ??
    [];

  if (!Array.isArray(rawStops)) return [];

  return rawStops
    .map((item: any, index: number) => normalizeStop(item, index + 1))
    .filter((stop) => {
      return (
        stop.id &&
        Number.isFinite(stop.latitude) &&
        Number.isFinite(stop.longitude) &&
        stop.latitude !== 0 &&
        stop.longitude !== 0
      );
    })
    .sort((a, b) => a.order - b.order);
}

export function normalizeRoutePresentation(
  input: any,
): RoutePresentation | null {
  if (!input) return null;

  const root = input?.data ?? input;
  const route = root?.route ?? {};
  const stops = pickStops(root);
  const polyline = pickPolyline(root);

  const origin = root?.origin
    ? normalizeStop(root.origin, 1)
    : stops.length > 0
      ? stops[0]
      : null;

  const destination = root?.destination
    ? normalizeStop(root.destination, stops.length)
    : stops.length > 0
      ? stops[stops.length - 1]
      : null;

  return {
    routeId: asString(root.routeId ?? root.id ?? route.id),
    routeName: asString(root.routeName ?? root.name ?? route.routeName),
    polyline,
    stops,
    origin,
    destination,
  };
}
