import { api } from "@/lib/api/axios";

export type UserRole = "ADMIN" | "DRIVER" | "PASSENGER";
export type UserApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type UserRegistrationSource = "ADMIN" | "SELF";

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  studentId?: string | null;
  phoneNumber?: string | null;
  approvalStatus: UserApprovalStatus;
  registrationSource: UserRegistrationSource;
  createdAt: string;
  updatedAt: string;
  sessionCount: number;
  drivenTripCount: number;
  canDelete: boolean;
  deleteBlockedReason?: string | null;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RegistrationSettings {
  passengerSelfRegistrationEnabled: boolean;
  updatedAt?: string;
}

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type AdminUsersPayload = Partial<{
  items: AdminUserItem[];
  meta: Partial<AdminUsersResponse["meta"]>;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapPayload<T>(payload: ApiEnvelope<T> | T): T {
  if (isRecord(payload) && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return payload as T;
}

function normalizeAdminUsersResponse(payload: unknown): AdminUsersResponse {
  const raw = unwrapPayload<AdminUsersPayload>(
    payload as ApiEnvelope<AdminUsersPayload>,
  );

  const items = Array.isArray(raw?.items) ? raw.items : [];
  const meta = raw?.meta ?? {};

  return {
    items,
    meta: {
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? 20),
      total: Number(meta.total ?? items.length),
      totalPages: Number(meta.totalPages ?? 1),
    },
  };
}

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  approvalStatus?: UserApprovalStatus;
  registrationSource?: UserRegistrationSource;
  academicDepartment?: string;
  academicBatch?: string;
}): Promise<AdminUsersResponse> {
  const res = await api.get("/admin/users", { params });
  return normalizeAdminUsersResponse(res.data);
}

export async function getRegistrationSettings(): Promise<RegistrationSettings> {
  const res = await api.get<ApiEnvelope<RegistrationSettings>>(
    "/admin/users/settings/registration",
  );

  return unwrapPayload<RegistrationSettings>(res.data);
}

export async function updateRegistrationSettings(
  payload: Pick<RegistrationSettings, "passengerSelfRegistrationEnabled">,
): Promise<RegistrationSettings> {
  const res = await api.patch<ApiEnvelope<RegistrationSettings>>(
    "/admin/users/settings/registration",
    payload,
  );

  return unwrapPayload<RegistrationSettings>(res.data);
}

export async function createAdminUser(payload: {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  isActive?: boolean;
  studentId?: string;
  phoneNumber?: string;
}) {
  const res = await api.post("/admin/users", payload);
  return res.data?.data ?? res.data;
}

export async function updateAdminUser(
  id: string,
  payload: Partial<{
    fullName: string;
    email: string;
    studentId: string | null;
    phoneNumber: string | null;
  }>,
) {
  const res = await api.patch(`/admin/users/${id}`, payload);
  return res.data?.data ?? res.data;
}

export async function updateUserRole(id: string, role: UserRole) {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data?.data ?? res.data;
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const res = await api.patch(`/admin/users/${id}/status`, { isActive });
  return res.data?.data ?? res.data;
}

export async function approvePassenger(id: string, note?: string) {
  const res = await api.patch(`/admin/users/${id}/approve`, { note });
  return res.data?.data ?? res.data;
}

export async function rejectPassenger(id: string, reason: string) {
  const res = await api.patch(`/admin/users/${id}/reject`, { reason });
  return res.data?.data ?? res.data;
}

export async function deleteUser(id: string) {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data?.data ?? res.data;
}
