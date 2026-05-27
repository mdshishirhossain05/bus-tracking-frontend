import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "ubts.accessToken";
const REFRESH_KEY = "ubts.refreshToken";

/**
 * Token source of truth. SecureStore is async, but request/socket interceptors
 * need the token synchronously — so we keep an in-memory mirror that is
 * hydrated once at startup and kept in sync on every write.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

type ClearListener = () => void;
const clearListeners = new Set<ClearListener>();

export function onTokensCleared(listener: ClearListener): () => void {
  clearListeners.add(listener);
  return () => clearListeners.delete(listener);
}

export async function hydrateTokens(): Promise<boolean> {
  [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return Boolean(accessToken);
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Reads the access token straight from secure storage, bypassing the in-memory
 * mirror. Needed by background tasks (e.g. the driver location task) whose JS
 * context is spun up fresh by the OS and never runs `hydrateTokens`.
 */
export async function getStoredAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export async function setTokens(
  nextAccess: string,
  nextRefresh: string,
): Promise<void> {
  accessToken = nextAccess;
  refreshToken = nextRefresh;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, nextAccess),
    SecureStore.setItemAsync(REFRESH_KEY, nextRefresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
  clearListeners.forEach((listener) => listener());
}
