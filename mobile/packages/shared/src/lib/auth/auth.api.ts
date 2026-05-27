import { api, unwrap } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import type { AuthUser } from "../../types";
import { clearTokens, setTokens } from "./tokenStore";

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await api.post(API_ENDPOINTS.auth.login, { email, password });
  const data = res.data?.data ?? res.data;

  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error(
      "Login did not return mobile tokens. Ensure the backend honors the X-Client-Type: mobile header.",
    );
  }

  await setTokens(data.accessToken, data.refreshToken);
  return data.user as AuthUser;
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await api.get(API_ENDPOINTS.auth.me);
  return unwrap<{ user: AuthUser }>(res.data)?.user ?? null;
}

export async function logout(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.auth.logout);
  } catch {
    // Best-effort server-side revoke; the local session is cleared regardless.
  } finally {
    await clearTokens();
  }
}
