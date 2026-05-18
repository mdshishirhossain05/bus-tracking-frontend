import { api } from "@/lib/api/axios";

export interface AdminUserSessionDashboardUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "DRIVER" | "PASSENGER";
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserSessionSummary {
  totalSessions: number;
  activeSessions: number;
  revokedSessions: number;
  sessionFamilies: number;
  latestSeenAt: string | null;
}

export interface AdminLatestSeenSession {
  id: string;
  deviceLabel: string | null;
  lastSeenAt: string | null;
  lastSeenIp: string | null;
  refreshFamilyId: string;
  active: boolean;
}

export interface AdminSessionFamily {
  familyId: string;
  sessionCount: number;
}

export interface AdminUserSessionItem {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  ipFirst: string | null;
  ipLast: string | null;
  lastSeenIp: string | null;
  deviceLabel: string | null;
  userAgentRaw: string | null;
  refreshFamilyId: string;
  roleSnapshot: "ADMIN" | "DRIVER" | "PASSENGER";
  isCurrent: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
  active: boolean;
}

export interface AdminUserSessionDashboardResponse {
  user: AdminUserSessionDashboardUser;
  summary: AdminUserSessionSummary;
  latestSeenSession: AdminLatestSeenSession | null;
  families: AdminSessionFamily[];
  sessions: AdminUserSessionItem[];
}

export async function getAdminUserSessionDashboard(userId: string) {
  const res = await api.get(`/admin/users/${userId}/session-dashboard`);
  return res.data?.data as AdminUserSessionDashboardResponse;
}

export async function revokeAdminSession(sessionId: string) {
  const res = await api.delete(`/admin/sessions/${sessionId}`);
  return res.data;
}
