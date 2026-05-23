import { api, unwrap } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { SessionInfo } from "../../types";

export async function listSessions(): Promise<SessionInfo[]> {
  const res = await api.get(API_ENDPOINTS.auth.sessions);
  return unwrap<{ sessions: SessionInfo[] }>(res.data)?.sessions ?? [];
}

export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(API_ENDPOINTS.auth.session(sessionId));
}

export async function logoutOtherSessions(): Promise<void> {
  await api.post(API_ENDPOINTS.auth.logoutOthers);
}
