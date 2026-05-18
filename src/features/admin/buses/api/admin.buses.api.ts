import { api } from "@/lib/api/axios";

export interface AdminBusGpsDeviceAssignment {
  id: string;
  assignedAt: string;
  notes: string | null;
  gpsDevice: {
    id: string;
    deviceCode: string;
    serialNumber: string | null;
    displayName: string | null;
    vendorName: string | null;
    modelName: string | null;
    imei: string | null;
    isActive: boolean;
    traccarManaged: boolean;
    traccarDeviceId: number | null;
    traccarUniqueId: string | null;
    traccarSyncStatus: "UNLINKED" | "LINKED" | "SYNCED" | "ERROR";
    lastSeenAt?: string | null;
    lastRecordedAt?: string | null;
    lastStatus?: "HEALTHY" | "STALE" | "UNHEALTHY" | "DISCONNECTED" | null;
  };
}

export interface AdminBusItem {
  id: string;
  busCode: string;
  plateNumber: string | null;
  capacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  activeGpsDeviceAssignment: AdminBusGpsDeviceAssignment | null;
}

export interface AdminBusAssignmentResponse {
  bus: {
    id: string;
    busCode: string;
    plateNumber: string | null;
    isActive: boolean;
  };
  assignment: AdminBusGpsDeviceAssignment | null;
  message?: string;
}

function mapGpsAssignment(item: any): AdminBusGpsDeviceAssignment {
  return {
    id: item.id,
    assignedAt: item.assignedAt,
    notes: item.notes ?? null,
    gpsDevice: {
      id: item.gpsDevice.id,
      deviceCode: item.gpsDevice.deviceCode,
      serialNumber: item.gpsDevice.serialNumber ?? null,
      displayName: item.gpsDevice.displayName ?? null,
      vendorName: item.gpsDevice.vendorName ?? null,
      modelName: item.gpsDevice.modelName ?? null,
      imei: item.gpsDevice.imei ?? null,
      isActive: Boolean(item.gpsDevice.isActive),
      traccarManaged: Boolean(item.gpsDevice.traccarManaged),
      traccarDeviceId:
        item.gpsDevice.traccarDeviceId == null
          ? null
          : Number(item.gpsDevice.traccarDeviceId),
      traccarUniqueId: item.gpsDevice.traccarUniqueId ?? null,
      traccarSyncStatus: item.gpsDevice.traccarSyncStatus ?? "UNLINKED",
      lastSeenAt: item.gpsDevice.lastSeenAt ?? null,
      lastRecordedAt: item.gpsDevice.lastRecordedAt ?? null,
      lastStatus: item.gpsDevice.lastStatus ?? null,
    },
  };
}

function mapAdminBus(item: any): AdminBusItem {
  return {
    id: item.id,
    busCode: item.busCode,
    plateNumber: item.plateNumber ?? null,
    capacity:
      item.capacity == null || item.capacity === ""
        ? null
        : Number(item.capacity),
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    activeGpsDeviceAssignment: item.activeGpsDeviceAssignment
      ? mapGpsAssignment(item.activeGpsDeviceAssignment)
      : null,
  };
}

export async function getAdminBuses(): Promise<AdminBusItem[]> {
  const res = await api.get("/admin/buses");
  const raw = res.data?.buses ?? res.data?.data ?? [];

  return Array.isArray(raw) ? raw.map(mapAdminBus) : [];
}

export async function createAdminBus(payload: {
  busCode: string;
  plateNumber?: string | null;
  capacity?: number | null;
  isActive?: boolean;
}) {
  const res = await api.post("/admin/buses", payload);
  return mapAdminBus(res.data?.bus ?? res.data?.data);
}

export async function updateAdminBus(
  id: string,
  payload: Partial<{
    busCode: string;
    plateNumber: string | null;
    capacity: number | null;
    isActive: boolean;
  }>,
) {
  const res = await api.patch(`/admin/buses/${id}`, payload);
  return mapAdminBus(res.data?.bus ?? res.data?.data);
}

export async function deleteAdminBus(id: string) {
  const res = await api.delete(`/admin/buses/${id}`);
  return res.data;
}

export async function assignGpsDeviceToBus(payload: {
  busId: string;
  gpsDeviceId: string;
  notes?: string | null;
}): Promise<AdminBusAssignmentResponse> {
  const res = await api.post(
    `/admin/buses/${payload.busId}/gps-device/assign`,
    {
      gpsDeviceId: payload.gpsDeviceId,
      notes: payload.notes ?? null,
    },
  );

  return {
    bus: {
      id: res.data.bus.id,
      busCode: res.data.bus.busCode,
      plateNumber: res.data.bus.plateNumber ?? null,
      isActive: Boolean(res.data.bus.isActive),
    },
    assignment: res.data.assignment
      ? mapGpsAssignment(res.data.assignment)
      : null,
    message: res.data.message ?? undefined,
  };
}

export async function unassignGpsDeviceFromBus(
  busId: string,
): Promise<AdminBusAssignmentResponse> {
  const res = await api.post(`/admin/buses/${busId}/gps-device/unassign`, {});

  return {
    bus: {
      id: res.data.bus.id,
      busCode: res.data.bus.busCode,
      plateNumber: res.data.bus.plateNumber ?? null,
      isActive: Boolean(res.data.bus.isActive),
    },
    assignment: null,
    message: res.data.message ?? undefined,
  };
}
