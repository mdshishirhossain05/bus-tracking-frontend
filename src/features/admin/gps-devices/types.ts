export interface AdminGpsAssignedBus {
  id: string;
  busCode: string;
  plateNumber: string | null;
  isActive: boolean;
}

export interface AdminGpsActiveAssignment {
  id: string;
  assignedAt: string;
  unassignedAt?: string | null;
  notes?: string | null;
  bus?: AdminGpsAssignedBus | null;
  gpsDevice?: {
    id: string;
    deviceCode: string;
    serialNumber?: string | null;
    displayName?: string | null;
    vendorName?: string | null;
    modelName?: string | null;
    imei?: string | null;
    notes?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    lastSeenAt?: string | null;
    lastRecordedAt?: string | null;
    lastStatus?: string | null;
  } | null;
}

export type AdminTraccarSyncStatus = "UNLINKED" | "LINKED" | "SYNCED" | "ERROR";

export type AdminTrackingMode = "TRACCAR" | "DIRECT";

export interface AdminGpsDeviceItem {
  id: string;
  deviceCode: string;
  serialNumber: string | null;
  displayName: string | null;
  vendorName: string | null;
  modelName: string | null;
  imei: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  lastSeenAt?: string | null;
  lastRecordedAt?: string | null;
  lastStatus?: "HEALTHY" | "STALE" | "UNHEALTHY" | "DISCONNECTED" | null;
  traccarManaged: boolean;
  traccarDeviceId: number | null;
  traccarUniqueId: string | null;
  traccarServerBaseUrl: string | null;
  traccarSyncStatus: AdminTraccarSyncStatus;
  traccarLastSyncAt: string | null;
  traccarLastError: string | null;
  activeAssignment: AdminGpsActiveAssignment | null;
}

export interface AdminGpsDeviceFormValues {
  deviceCode: string;
  serialNumber: string | null;
  displayName: string | null;
  vendorName: string | null;
  modelName: string | null;
  imei: string | null;
  notes: string | null;
  isActive: boolean;
  traccarManaged: boolean;
  traccarDeviceId: number | null;
  traccarUniqueId: string | null;
  traccarServerBaseUrl: string | null;
}

export interface AdminBusOption {
  id: string;
  busCode: string;
  plateNumber: string | null;
  capacity: number | null;
  isActive: boolean;
}
