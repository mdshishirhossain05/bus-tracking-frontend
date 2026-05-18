import { api } from "@/lib/api/axios";

export interface AdminRouteLite {
  id: string;
  routeName: string;
  description: string | null;
  isActive: boolean;
}

export interface AdminStopLite {
  id: string;
  stopName: string;
  lat: number;
  lng: number;
}

export interface AdminAssignedRouteStop {
  id?: string;
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  stopOrder: number;
  distanceFromStartKm?: number | null;
}

export interface RouteGeometryPoint {
  lat: number;
  lng: number;
}

export interface AdminRouteStopsSummary {
  distanceKm: number | null;
  durationMinutes: number | null;
  source: "GOOGLE_ROUTES" | "SAVED_GEOMETRY" | "STRAIGHT_LINE" | "UNKNOWN";
}

export interface AdminRouteStopsResponse {
  stops: AdminAssignedRouteStop[];
  geometry: RouteGeometryPoint[];
  summary: AdminRouteStopsSummary;
  message?: string;
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeGeometryPoint(point: any): RouteGeometryPoint | null {
  const lat = asNumberOrNull(point?.lat ?? point?.latitude);
  const lng = asNumberOrNull(point?.lng ?? point?.longitude);

  if (lat == null || lng == null) return null;

  return { lat, lng };
}

function normalizeAssignedStopsResponse(data: any): AdminRouteStopsResponse {
  const root = data?.data ?? data ?? {};
  const route = root?.route ?? data?.route ?? null;

  const rawStops =
    root?.stops ??
    root?.routeStops ??
    route?.routeStops ??
    data?.stops ??
    data?.routeStops ??
    [];

  const geometryRaw =
    root?.geometry ??
    root?.routeGeometry ??
    route?.geometry?.polyline ??
    route?.routeGeometry?.polyline ??
    data?.geometry ??
    data?.routeGeometry ??
    [];

  const stops = Array.isArray(rawStops)
    ? rawStops.map((item: any, index: number) => {
        const stop = item.stop ?? item;

        return {
          id: item.id,
          stopId: item.stopId ?? stop.id,
          stopName: stop.stopName,
          lat: Number(stop.lat),
          lng: Number(stop.lng),
          stopOrder: Number(item.stopOrder ?? index + 1),
          distanceFromStartKm:
            item.distanceFromStartKm == null
              ? null
              : Number(item.distanceFromStartKm),
        };
      })
    : [];

  const geometry = Array.isArray(geometryRaw)
    ? (geometryRaw
        .map((point: any) => normalizeGeometryPoint(point))
        .filter(Boolean) as RouteGeometryPoint[])
    : [];

  const distanceKm =
    asNumberOrNull(root?.summary?.distanceKm) ??
    asNumberOrNull(root?.distanceKm) ??
    asNumberOrNull(root?.totalDistanceKm) ??
    asNumberOrNull(route?.distanceKm) ??
    asNumberOrNull(route?.totalDistanceKm) ??
    asNumberOrNull(route?.geometry?.distanceKm) ??
    null;

  const durationMinutes =
    asNumberOrNull(root?.summary?.durationMinutes) ??
    asNumberOrNull(root?.durationMinutes) ??
    asNumberOrNull(root?.estimatedDurationMinutes) ??
    asNumberOrNull(route?.durationMinutes) ??
    asNumberOrNull(route?.estimatedDurationMinutes) ??
    asNumberOrNull(route?.geometry?.durationMinutes) ??
    null;

  const source =
    root?.summary?.source ??
    root?.geometrySource ??
    route?.geometry?.source ??
    (geometry.length >= 2 ? "SAVED_GEOMETRY" : "UNKNOWN");

  return {
    stops,
    geometry,
    summary: {
      distanceKm,
      durationMinutes,
      source:
        source === "GOOGLE_ROUTES" ||
        source === "SAVED_GEOMETRY" ||
        source === "STRAIGHT_LINE"
          ? source
          : "UNKNOWN",
    },
    message: root?.message ?? data?.message,
  };
}

function buildUpdatePayload(stops: AdminAssignedRouteStop[]) {
  return {
    stops: stops.map((item, index) => ({
      stopId: item.stopId,
      stopOrder: index + 1,
    })),
  };
}

export async function getAdminRoutesLite(): Promise<AdminRouteLite[]> {
  const res = await api.get("/admin/routes");
  const raw = res.data?.routes ?? res.data?.data ?? [];

  return Array.isArray(raw)
    ? raw.map((item: any) => ({
        id: item.id,
        routeName: item.routeName,
        description: item.description ?? null,
        isActive: Boolean(item.isActive),
      }))
    : [];
}

export async function getAdminStopsLite(): Promise<AdminStopLite[]> {
  const res = await api.get("/admin/stops");
  const raw = res.data?.stops ?? res.data?.data ?? [];

  return Array.isArray(raw)
    ? raw
        .filter((item: any) => item.isActive !== false)
        .map((item: any) => ({
          id: item.id,
          stopName: item.stopName,
          lat: Number(item.lat),
          lng: Number(item.lng),
        }))
    : [];
}

export async function getAdminRouteStops(
  routeId: string,
): Promise<AdminRouteStopsResponse> {
  const res = await api.get(`/admin/routes/${routeId}/stops`);
  return normalizeAssignedStopsResponse(res.data);
}

export async function updateAdminRouteStops(
  routeId: string,
  stops: AdminAssignedRouteStop[],
): Promise<AdminRouteStopsResponse> {
  const payload = buildUpdatePayload(stops);
  const res = await api.put(`/admin/routes/${routeId}/stops`, payload);
  return normalizeAssignedStopsResponse(res.data);
}
