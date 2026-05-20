import { api } from "@/lib/api/axios";

export type DayType =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface ServiceScheduleItem {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busCode: string;
  plateNumber: string | null;
  driverId: string | null;
  driverName: string | null;
  driverEmail: string | null;
  dayType: DayType;
  departureTime: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tripCount: number;
}

export interface ServiceScheduleListResponse {
  items: ServiceScheduleItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RouteOption {
  id: string;
  routeName: string;
  isActive: boolean;
}

export interface BusOption {
  id: string;
  busCode: string;
  plateNumber: string | null;
  isActive: boolean;
  hasActiveGpsDevice: boolean;
}

export interface DriverOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  approvalStatus?: string | null;
}

export interface RouteOperationalReadiness {
  routeId: string;
  routeName: string;
  isReady: boolean;
  stopCount: number;
  issues: string[];
}

export interface ArchiveServiceScheduleResponse {
  alreadyArchived: boolean;
  item: ServiceScheduleItem | null;
}

export interface RestoreServiceScheduleResponse {
  alreadyRestored: boolean;
  item: ServiceScheduleItem | null;
}

export interface PermanentDeleteServiceScheduleResponse {
  permanentlyDeleted: boolean;
  unlinkedTripCount: number;
}

export interface DeleteServiceScheduleResponse {
  deleted: boolean;
  archived: boolean;
  item: ServiceScheduleItem | null;
}

function normalizeServiceScheduleItem(item: any): ServiceScheduleItem {
  return {
    id: item.id,
    routeId: item.routeId,
    routeName: item.routeName,
    busId: item.busId,
    busCode: item.busCode,
    plateNumber: item.plateNumber ?? null,
    driverId: item.driverId,
    driverName: item.driverName,
    driverEmail: item.driverEmail,
    dayType: item.dayType,
    departureTime: item.departureTime,
    isActive: Boolean(item.isActive),
    notes: item.notes ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tripCount: Number(item.tripCount ?? 0),
  };
}

function normalizeListResponse(data: any): ServiceScheduleListResponse {
  const payload = data?.data ?? data ?? {};
  const rawItems = payload.items ?? payload.schedules ?? [];
  const meta = payload.meta ?? {};

  return {
    items: Array.isArray(rawItems)
      ? rawItems.map(normalizeServiceScheduleItem)
      : [],
    meta: {
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? 20),
      total: Number(meta.total ?? rawItems.length ?? 0),
      totalPages: Number(meta.totalPages ?? 1),
    },
  };
}

function normalizeMutationItem(data: any): ServiceScheduleItem {
  return normalizeServiceScheduleItem(data?.data ?? data?.item ?? data);
}

function normalizeDriverOption(item: any): DriverOption {
  return {
    id: item.id,
    fullName: item.fullName,
    email: item.email,
    role: item.role,
    isActive: Boolean(item.isActive),
    approvalStatus: item.approvalStatus ?? null,
  };
}

function normalizeDriverPayload(data: any): DriverOption[] {
  const payload = data?.data ?? data ?? {};
  const raw =
    payload.users ??
    payload.items ??
    data?.users ??
    data?.items ??
    data?.data?.users ??
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item: any) => {
      if (item.role !== "DRIVER") return false;
      if (item.isActive !== true) return false;

      const approvalStatus = item.approvalStatus ?? "APPROVED";
      return approvalStatus === "APPROVED";
    })
    .map(normalizeDriverOption)
    .sort((a, b) =>
      a.fullName.localeCompare(b.fullName, undefined, {
        sensitivity: "base",
      }),
    );
}

export async function getServiceSchedules(params: {
  page?: number;
  limit?: number;
  routeId?: string;
  busId?: string;
  driverId?: string;
  dayType?: DayType;
  isActive?: boolean;
  search?: string;
}): Promise<ServiceScheduleListResponse> {
  const res = await api.get("/admin/service-schedules", { params });
  return normalizeListResponse(res.data);
}

export async function createServiceSchedule(payload: {
  routeId: string;
  busId: string;
  driverId: string | null;
  dayType: DayType;
  departureTime: string;
  isActive?: boolean;
  notes?: string | null;
}): Promise<ServiceScheduleItem> {
  const res = await api.post("/admin/service-schedules", payload);
  return normalizeMutationItem(res.data);
}

export async function updateServiceSchedule(
  id: string,
  payload: Partial<{
    routeId: string;
    busId: string;
    driverId: string | null;
    dayType: DayType;
    departureTime: string;
    isActive: boolean;
    notes: string | null;
  }>,
): Promise<ServiceScheduleItem> {
  const res = await api.patch(`/admin/service-schedules/${id}`, payload);
  return normalizeMutationItem(res.data);
}

export async function deleteServiceSchedule(
  id: string,
): Promise<DeleteServiceScheduleResponse> {
  const res = await api.delete(`/admin/service-schedules/${id}`);
  return res.data?.data;
}

export async function archiveServiceSchedule(
  id: string,
): Promise<ArchiveServiceScheduleResponse> {
  const res = await api.post(`/admin/service-schedules/${id}/archive`);
  const payload = res.data?.data ?? {};

  return {
    alreadyArchived: Boolean(payload.alreadyArchived),
    item: payload.item ? normalizeServiceScheduleItem(payload.item) : null,
  };
}

export async function restoreServiceSchedule(
  id: string,
): Promise<RestoreServiceScheduleResponse> {
  const res = await api.post(`/admin/service-schedules/${id}/restore`);
  const payload = res.data?.data ?? {};

  return {
    alreadyRestored: Boolean(payload.alreadyRestored),
    item: payload.item ? normalizeServiceScheduleItem(payload.item) : null,
  };
}

export async function permanentlyDeleteServiceSchedule(
  id: string,
): Promise<PermanentDeleteServiceScheduleResponse> {
  const res = await api.delete(
    `/admin/service-schedules/${id}/permanent-delete`,
  );

  return {
    permanentlyDeleted: Boolean(res.data?.data?.permanentlyDeleted),
    unlinkedTripCount: Number(res.data?.data?.unlinkedTripCount ?? 0),
  };
}

export async function getRouteOptions(): Promise<RouteOption[]> {
  const res = await api.get("/admin/routes");
  const raw = res.data?.routes ?? res.data?.data ?? [];

  return Array.isArray(raw)
    ? raw.map((item: any) => ({
        id: item.id,
        routeName: item.routeName,
        isActive: Boolean(item.isActive),
      }))
    : [];
}

export async function getBusOptions(): Promise<BusOption[]> {
  const res = await api.get("/admin/buses");
  const raw = res.data?.buses ?? res.data?.data ?? [];

  return Array.isArray(raw)
    ? raw.map((item: any) => ({
        id: item.id,
        busCode: item.busCode,
        plateNumber: item.plateNumber ?? null,
        isActive: Boolean(item.isActive),
        hasActiveGpsDevice: Boolean(item.activeGpsDeviceAssignment),
      }))
    : [];
}

export async function getDriverOptions(params?: {
  search?: string;
}): Promise<DriverOption[]> {
  const search = params?.search?.trim();

  const res = await api.get("/admin/users", {
    params: {
      page: 1,
      limit: 100,
      role: "DRIVER",
      isActive: true,
      ...(search ? { search } : {}),
    },
  });

  return normalizeDriverPayload(res.data);
}

export async function searchDriverOptions(
  query: string,
): Promise<DriverOption[]> {
  const q = query.trim();

  if (q.length < 2) {
    return getDriverOptions();
  }

  try {
    const res = await api.get("/admin/users/search", {
      params: { q },
    });

    return normalizeDriverPayload(res.data);
  } catch {
    return getDriverOptions({ search: q });
  }
}

export async function getRouteOperationalReadiness(
  routeId: string,
): Promise<RouteOperationalReadiness> {
  const res = await api.get(`/admin/routes/${routeId}/stops`);

  const route = res.data?.route ?? null;
  const routeStopsRaw =
    res.data?.stops ?? res.data?.data?.stops ?? route?.routeStops ?? [];

  if (!route) {
    return {
      routeId,
      routeName: "Unknown route",
      isReady: false,
      stopCount: 0,
      issues: ["Route data could not be loaded."],
    };
  }

  const routeStops = Array.isArray(routeStopsRaw) ? routeStopsRaw : [];
  const sorted = [...routeStops].sort((a, b) => a.stopOrder - b.stopOrder);

  const issues: string[] = [];

  if (sorted.length < 2) {
    issues.push("At least 2 assigned stops are required.");
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (!current) continue;

    const expectedOrder = i + 1;

    if (current.stopOrder !== expectedOrder) {
      issues.push(
        "Stop order must be continuous and start from 1 without gaps.",
      );
      break;
    }
  }

  const hasAnyDistance = sorted.some(
    (item) => item.distanceFromStartKm != null,
  );
  const hasMissingDistance = sorted.some(
    (item) => item.distanceFromStartKm == null,
  );

  if (hasAnyDistance && hasMissingDistance) {
    issues.push(
      "Route distance data is incomplete. Save route stops again to recalculate distance automatically.",
    );
  }

  if (hasAnyDistance) {
    let previousDistance = -1;

    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      if (!current) continue;

      const distance = Number(current.distanceFromStartKm ?? 0);

      if (i === 0 && distance !== 0) {
        issues.push("The first stop distance must be 0.");
        break;
      }

      if (distance < previousDistance) {
        issues.push("Stop distance must be non-decreasing across route order.");
        break;
      }

      previousDistance = distance;
    }
  }

  return {
    routeId,
    routeName: route.routeName ?? "Unknown route",
    isReady: issues.length === 0,
    stopCount: sorted.length,
    issues,
  };
}
