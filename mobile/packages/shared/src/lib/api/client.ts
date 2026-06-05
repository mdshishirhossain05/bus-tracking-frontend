import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { env } from "../../config/env";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "../auth/tokenStore";

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/** Marks this client as mobile so the backend returns tokens in the body. */
const MOBILE_HEADERS: Record<string, string> = { "X-Client-Type": "mobile" };

// Device-identification headers — read once at module load. The backend
// uses these to label sessions on the profile "Devices" list. Without
// them the only signal is the okhttp user-agent string, which the
// backend can't parse into anything useful.
const deviceModel =
  Device.deviceName?.trim() ||
  [Device.brand, Device.modelName].filter(Boolean).join(" ").trim() ||
  Device.modelName ||
  "Mobile device";
const deviceOs =
  [Device.osName, Device.osVersion].filter(Boolean).join(" ").trim() ||
  Platform.OS;
MOBILE_HEADERS["X-Device-Model"] = deviceModel;
MOBILE_HEADERS["X-Device-Os"] = deviceOs;

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json", ...MOBILE_HEADERS },
  timeout: 15000,
});

/** Bare client for refresh — no interceptors, so it can never recurse. */
const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json", ...MOBILE_HEADERS },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

async function runRefresh(): Promise<boolean> {
  const token = getRefreshToken();
  if (!token) return false;

  try {
    const res = await refreshClient.post("/auth/refresh", {
      refreshToken: token,
    });
    const data = res.data?.data ?? res.data;
    if (data?.accessToken && data?.refreshToken) {
      await setTokens(data.accessToken, data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isAuthRoute(url?: string): boolean {
  return Boolean(
    url &&
      (url.includes("/auth/login") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/logout")),
  );
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || isAuthRoute(original.url)) {
      return Promise.reject(error);
    }
    if (original._retry) {
      await clearTokens();
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise = refreshPromise ?? runRefresh();
    const refreshed = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!refreshed) {
      await clearTokens();
      return Promise.reject(error);
    }

    const token = getAccessToken();
    if (token) original.headers.set("Authorization", `Bearer ${token}`);
    return api(original);
  },
);

/** Unwraps the backend's `{ success, message, data }` envelope. */
export function unwrap<T>(payload: any): T | null {
  if (payload == null) return null;
  if (payload.data !== undefined) return payload.data as T;
  return payload as T;
}
