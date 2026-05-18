import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/lib/config/env";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const SESSION_EXPIRED_EVENT = "app:session-expired";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<void> | null = null;

function emitSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function shouldSkipRefresh(config?: RetryableRequestConfig) {
  const url = config?.url ?? "";

  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      shouldSkipRefresh(originalRequest)
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      emitSessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      return api(originalRequest);
    } catch (refreshError) {
      emitSessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export { SESSION_EXPIRED_EVENT };
