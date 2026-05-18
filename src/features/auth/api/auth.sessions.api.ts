import { api } from "@/lib/api/axios";

export interface AuthSessionItem {
  id: string;
  createdAt: string;
  lastSeenAt: string | null;
  ipFirst: string | null;
  ipLast: string | null;
  lastSeenIp: string | null;
  deviceLabel: string | null;
  userAgentRaw: string | null;
  refreshFamilyId: string | null;
  roleSnapshot: "ADMIN" | "DRIVER" | "PASSENGER" | string;
  isCurrent: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  active: boolean;
}

function normalizeSession(item: any): AuthSessionItem {
  return {
    id: item.id,
    createdAt: item.createdAt,
    lastSeenAt: item.lastSeenAt ?? null,
    ipFirst: item.ipFirst ?? null,
    ipLast: item.ipLast ?? null,
    lastSeenIp: item.lastSeenIp ?? null,
    deviceLabel: item.deviceLabel ?? null,
    userAgentRaw: item.userAgentRaw ?? null,
    refreshFamilyId: item.refreshFamilyId ?? null,
    roleSnapshot: item.roleSnapshot ?? "PASSENGER",
    isCurrent: Boolean(item.isCurrent),
    revokedAt: item.revokedAt ?? null,
    revokedReason: item.revokedReason ?? null,
    active:
      typeof item.active === "boolean" ? item.active : item.revokedAt == null,
  };
}

export async function getMySessions(): Promise<AuthSessionItem[]> {
  const res = await api.get("/auth/sessions");

  const raw =
    res.data?.data?.sessions ?? res.data?.sessions ?? res.data?.data ?? [];

  return Array.isArray(raw) ? raw.map(normalizeSession) : [];
}

export async function logoutAllSessions() {
  const res = await api.post("/auth/logout-all");
  return res.data;
}

export async function logoutOtherSessions() {
  const res = await api.post("/auth/logout-others");
  return res.data;
}

export async function revokeSession(sessionId: string) {
  const res = await api.delete(`/auth/sessions/${sessionId}`);
  return res.data;
}
