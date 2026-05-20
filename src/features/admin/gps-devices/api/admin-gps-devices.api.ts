import { api } from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminBusOption,
  AdminGpsDeviceFormValues,
  AdminGpsDeviceItem,
} from "../types";

function mapBusOption(item: any): AdminBusOption {
  return {
    id: item.id,
    busCode: item.busCode,
    plateNumber: item.plateNumber ?? null,
    capacity:
      item.capacity == null || item.capacity === ""
        ? null
        : Number(item.capacity),
    isActive: Boolean(item.isActive),
  };
}

function mapGpsDevice(item: any): AdminGpsDeviceItem {
  return {
    id: item.id,
    deviceCode: item.deviceCode,
    serialNumber: item.serialNumber ?? null,
    displayName: item.displayName ?? null,
    vendorName: item.vendorName ?? null,
    modelName: item.modelName ?? null,
    imei: item.imei ?? null,
    notes: item.notes ?? null,
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? null,
    lastSeenAt: item.lastSeenAt ?? null,
    lastRecordedAt: item.lastRecordedAt ?? null,
    lastStatus: item.lastStatus ?? null,
    lastLat: item.lastLat == null ? null : Number(item.lastLat),
    lastLng: item.lastLng == null ? null : Number(item.lastLng),
    lastSpeedKmh: item.lastSpeedKmh == null ? null : Number(item.lastSpeedKmh),
    lastHeading: item.lastHeading == null ? null : Number(item.lastHeading),
    lastAccuracyM:
      item.lastAccuracyM == null ? null : Number(item.lastAccuracyM),
    health: item.health ?? "NEVER_SEEN",
    lastSeenAgeSeconds:
      item.lastSeenAgeSeconds == null
        ? null
        : Number(item.lastSeenAgeSeconds),
    traccarManaged: Boolean(item.traccarManaged),
    traccarDeviceId:
      item.traccarDeviceId == null ? null : Number(item.traccarDeviceId),
    traccarUniqueId: item.traccarUniqueId ?? null,
    traccarServerBaseUrl: item.traccarServerBaseUrl ?? null,
    traccarSyncStatus: item.traccarSyncStatus ?? "UNLINKED",
    traccarLastSyncAt: item.traccarLastSyncAt ?? null,
    traccarLastError: item.traccarLastError ?? null,
    activeAssignment: item.activeAssignment
      ? {
          id: item.activeAssignment.id,
          assignedAt: item.activeAssignment.assignedAt,
          unassignedAt: item.activeAssignment.unassignedAt ?? null,
          notes: item.activeAssignment.notes ?? null,
          bus: item.activeAssignment.bus
            ? {
                id: item.activeAssignment.bus.id,
                busCode: item.activeAssignment.bus.busCode,
                plateNumber: item.activeAssignment.bus.plateNumber ?? null,
                isActive: Boolean(item.activeAssignment.bus.isActive),
              }
            : null,
          gpsDevice: item.activeAssignment.gpsDevice
            ? {
                id: item.activeAssignment.gpsDevice.id,
                deviceCode: item.activeAssignment.gpsDevice.deviceCode,
                serialNumber:
                  item.activeAssignment.gpsDevice.serialNumber ?? null,
                displayName:
                  item.activeAssignment.gpsDevice.displayName ?? null,
                vendorName: item.activeAssignment.gpsDevice.vendorName ?? null,
                modelName: item.activeAssignment.gpsDevice.modelName ?? null,
                imei: item.activeAssignment.gpsDevice.imei ?? null,
                notes: item.activeAssignment.gpsDevice.notes ?? null,
                isActive: Boolean(item.activeAssignment.gpsDevice.isActive),
                createdAt: item.activeAssignment.gpsDevice.createdAt,
                updatedAt: item.activeAssignment.gpsDevice.updatedAt ?? null,
                lastSeenAt: item.activeAssignment.gpsDevice.lastSeenAt ?? null,
                lastRecordedAt:
                  item.activeAssignment.gpsDevice.lastRecordedAt ?? null,
                lastStatus: item.activeAssignment.gpsDevice.lastStatus ?? null,
              }
            : null,
        }
      : null,
  };
}

function cacheBustConfig() {
  return {
    params: {
      _ts: Date.now(),
    },
  } as const;
}

export async function getAdminGpsDevices(): Promise<AdminGpsDeviceItem[]> {
  const res = await api.get(API_ENDPOINTS.admin.gpsDevices, cacheBustConfig());
  const raw = res.data?.gpsDevices ?? res.data?.data ?? [];
  return Array.isArray(raw) ? raw.map(mapGpsDevice) : [];
}

export async function createAdminGpsDevice(payload: {
  deviceCode: string;
  serialNumber?: string | null;
  displayName?: string | null;
  vendorName?: string | null;
  modelName?: string | null;
  imei?: string | null;
  notes?: string | null;
  isActive?: boolean;
  apiKey?: string | null;
  traccarManaged?: boolean;
  traccarDeviceId?: number | null;
  traccarUniqueId?: string | null;
  traccarServerBaseUrl?: string | null;
}) {
  const res = await api.post(API_ENDPOINTS.admin.gpsDevices, payload);
  return {
    gpsDevice: res.data?.gpsDevice ? mapGpsDevice(res.data.gpsDevice) : null,
    generatedApiKey:
      res.data?.generatedApiKey ?? res.data?.data?.generatedApiKey ?? null,
    message: res.data?.message ?? null,
  };
}

export async function updateAdminGpsDevice(
  id: string,
  payload: Partial<
    AdminGpsDeviceFormValues & {
      rotateApiKey?: boolean;
    }
  >,
) {
  const res = await api.patch(API_ENDPOINTS.admin.gpsDeviceById(id), payload);
  return {
    gpsDevice: res.data?.gpsDevice ? mapGpsDevice(res.data.gpsDevice) : null,
    generatedApiKey:
      res.data?.generatedApiKey ?? res.data?.data?.generatedApiKey ?? null,
    message: res.data?.message ?? null,
  };
}

export async function deleteAdminGpsDevice(id: string) {
  const res = await api.delete(API_ENDPOINTS.admin.gpsDeviceById(id));
  return res.data;
}

export async function getAdminBusOptions(): Promise<AdminBusOption[]> {
  const res = await api.get("/admin/buses", cacheBustConfig());
  const raw = res.data?.buses ?? res.data?.data ?? [];
  return Array.isArray(raw) ? raw.map(mapBusOption) : [];
}

export async function assignGpsDeviceToBus(payload: {
  busId: string;
  gpsDeviceId: string;
  notes?: string | null;
}) {
  const res = await api.post(
    API_ENDPOINTS.admin.assignGpsDeviceToBus(payload.busId),
    {
      gpsDeviceId: payload.gpsDeviceId,
      notes: payload.notes ?? null,
    },
  );
  return res.data;
}

export async function unassignGpsDeviceFromBus(busId: string) {
  const res = await api.post(
    API_ENDPOINTS.admin.unassignGpsDeviceFromBus(busId),
    {},
  );
  return res.data;
}

export async function reconcileAdminGpsDeviceWithTraccar(id: string) {
  const res = await api.post(`/admin/gps-devices/${id}/traccar/reconcile`, {});
  return {
    gpsDevice: res.data?.gpsDevice ? mapGpsDevice(res.data.gpsDevice) : null,
    remoteDevice: res.data?.remoteDevice ?? null,
    message: res.data?.message ?? null,
  };
}

export async function getAdminGpsDeviceTraccarStatus(id: string) {
  const res = await api.get(
    `/admin/gps-devices/${id}/traccar/status`,
    cacheBustConfig(),
  );
  return {
    gpsDevice: res.data?.gpsDevice ? mapGpsDevice(res.data.gpsDevice) : null,
    remoteDevice: res.data?.remoteDevice ?? null,
    resolvedUniqueId: res.data?.resolvedUniqueId ?? null,
    resolvedServerBaseUrl: res.data?.resolvedServerBaseUrl ?? null,
    traccarConfigured: Boolean(res.data?.traccarConfigured),
    message: res.data?.message ?? null,
  };
}
