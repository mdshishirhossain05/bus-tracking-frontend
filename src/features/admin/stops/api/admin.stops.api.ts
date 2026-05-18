import { api } from "@/lib/api/axios";

export interface StopUsageSummary {
  routeStops: number;
  schedules: number;
  stopArrivals: number;
}

export interface StopItem {
  id: string;
  stopName: string;
  stopCode: string | null;
  landmark: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt?: string;
  usageSummary?: StopUsageSummary;
}

export interface StopUsageDetails {
  stop: StopItem;
  canDelete: boolean;
  routeUsages: Array<{
    routeId: string;
    routeName: string;
    routeIsActive: boolean;
    stopOrder: number;
  }>;
  summary: StopUsageSummary;
}

export interface DeleteStopResult {
  message: string;
  deleted: boolean;
  alreadyDeleted: boolean;
}

function normalizeStop(item: any): StopItem {
  return {
    id: item.id,
    stopName: item.stopName,
    stopCode: item.stopCode ?? null,
    landmark: item.landmark ?? null,
    address: item.address ?? null,
    notes: item.notes ?? null,
    isActive: Boolean(item.isActive),
    lat: Number(item.lat),
    lng: Number(item.lng),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    usageSummary: item.usageSummary
      ? {
          routeStops: Number(item.usageSummary.routeStops ?? 0),
          schedules: Number(item.usageSummary.schedules ?? 0),
          stopArrivals: Number(item.usageSummary.stopArrivals ?? 0),
        }
      : undefined,
  };
}

function normalizeStopsPayload(data: any): StopItem[] {
  const raw = data?.stops ?? data?.data?.stops ?? data?.data ?? [];
  return Array.isArray(raw) ? raw.map(normalizeStop) : [];
}

export async function getStops(): Promise<StopItem[]> {
  const res = await api.get("/admin/stops");
  return normalizeStopsPayload(res.data);
}

export async function getStopUsage(id: string): Promise<StopUsageDetails> {
  const res = await api.get(`/admin/stops/${id}/usage`);
  const raw = res.data?.usage ?? res.data?.data?.usage;

  return {
    stop: normalizeStop(raw.stop),
    canDelete: Boolean(raw.canDelete),
    routeUsages: Array.isArray(raw.routeUsages) ? raw.routeUsages : [],
    summary: {
      routeStops: Number(raw.summary?.routeStops ?? 0),
      schedules: Number(raw.summary?.schedules ?? 0),
      stopArrivals: Number(raw.summary?.stopArrivals ?? 0),
    },
  };
}

export async function createStop(payload: {
  stopName: string;
  stopCode?: string | null;
  landmark?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
  lat: number;
  lng: number;
}) {
  const res = await api.post("/admin/stops", payload);
  return normalizeStop(res.data?.stop ?? res.data?.data);
}

export async function updateStop(
  id: string,
  payload: Partial<{
    stopName: string;
    stopCode: string | null;
    landmark: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    lat: number;
    lng: number;
  }>,
) {
  const res = await api.patch(`/admin/stops/${id}`, payload);
  return normalizeStop(res.data?.stop ?? res.data?.data);
}

export async function deleteStop(id: string): Promise<DeleteStopResult> {
  const res = await api.delete(`/admin/stops/${id}`);

  return {
    message: res.data?.message ?? "Stop deleted successfully",
    deleted: Boolean(res.data?.deleted ?? true),
    alreadyDeleted: Boolean(res.data?.alreadyDeleted ?? false),
  };
}
