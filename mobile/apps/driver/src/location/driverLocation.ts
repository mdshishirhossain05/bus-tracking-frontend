import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { env, getStoredAccessToken } from "@ubts/shared";

/** OS-level identifier for the background location task. */
export const DRIVER_LOCATION_TASK = "ubts-driver-location";

const ACTIVE_TRIP_KEY = "ubts.driver.activeTripId";

export async function setActiveTripId(tripId: string | null): Promise<void> {
  if (tripId) await SecureStore.setItemAsync(ACTIVE_TRIP_KEY, tripId);
  else await SecureStore.deleteItemAsync(ACTIVE_TRIP_KEY);
}

export async function getActiveTripId(): Promise<string | null> {
  return SecureStore.getItemAsync(ACTIVE_TRIP_KEY);
}

/**
 * Posts a single GPS fix to the backend over HTTP. Used by the background
 * task, so it reads the trip id and token straight from secure storage rather
 * than relying on any in-memory app state (which doesn't exist in the headless
 * background JS context). The backend feeds HTTP and socket fixes through the
 * same pipeline, so this is a first-class transport, not a degraded one.
 */
export async function postLocationFix(
  coords: Location.LocationObjectCoords,
  timestamp: number,
): Promise<void> {
  const [tripId, token] = await Promise.all([
    getActiveTripId(),
    getStoredAccessToken(),
  ]);
  if (!tripId || !token) return;

  const body = {
    lat: coords.latitude,
    lng: coords.longitude,
    speedKmh:
      coords.speed != null && coords.speed >= 0
        ? Number((coords.speed * 3.6).toFixed(2))
        : undefined,
    heading:
      coords.heading != null && coords.heading >= 0
        ? Math.round(coords.heading)
        : undefined,
    accuracyM: coords.accuracy != null ? Math.round(coords.accuracy) : undefined,
    recordedAt: new Date(timestamp).toISOString(),
  };

  await fetch(`${env.apiBaseUrl}/driver/trips/${tripId}/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Type": "mobile",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

/** Requests foreground then background location permission (iOS needs both). */
export async function ensureLocationPermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === "granted";
}

export async function isStreaming(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(
    () => false,
  );
}

export async function startStreaming(tripId: string): Promise<void> {
  await setActiveTripId(tripId);
  if (await isStreaming()) return;

  await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 3000,
    distanceInterval: 5,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    activityType: Location.LocationActivityType.AutomotiveNavigation,
    foregroundService: {
      notificationTitle: "Sharing bus location",
      notificationBody: "Passengers can see this bus moving live.",
      notificationColor: "#3b82f6",
    },
  });
}

export async function stopStreaming(): Promise<void> {
  if (await isStreaming()) {
    await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  }
  await setActiveTripId(null);
}
