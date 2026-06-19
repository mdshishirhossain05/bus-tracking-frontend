import * as Location from "expo-location";

/**
 * OS-level identifier for the passenger keep-alive task.
 *
 * Unlike the driver, the passenger app does NOT broadcast its own location.
 * We start an `expo-location` foreground service purely to keep the JS
 * runtime alive while the app is backgrounded, so the existing trip socket
 * keeps streaming and we can keep the "live tracking" notification on screen
 * (and refresh its text) the way a navigation app does. The location the
 * service collects is never sent anywhere — see `backgroundTask.ts`, whose
 * handler is intentionally a no-op.
 */
export const PASSENGER_KEEPALIVE_TASK = "ubts-passenger-keepalive";

const NOTIFICATION_COLOR = "#2563eb";

let starting = false;
/** Last text we asked the FG service to show, so we skip redundant refreshes. */
let lastBody: string | null = null;

export interface TrackingNotificationContent {
  title: string;
  body: string;
}

/**
 * Foreground + background location permission. Background is required for a
 * location foreground service to keep running once the screen is off. If the
 * rider declines, we resolve `false` and the caller silently falls back to
 * server push notifications (which need no extra permission).
 */
export async function ensureBackgroundPermissions(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync();
  let fgGranted = fg.granted;
  if (!fgGranted && fg.canAskAgain) {
    fgGranted = (await Location.requestForegroundPermissionsAsync()).granted;
  }
  if (!fgGranted) return false;

  const bg = await Location.getBackgroundPermissionsAsync();
  let bgGranted = bg.granted;
  if (!bgGranted && bg.canAskAgain) {
    bgGranted = (await Location.requestBackgroundPermissionsAsync()).granted;
  }
  return bgGranted;
}

export async function isTrackingServiceRunning(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(PASSENGER_KEEPALIVE_TASK).catch(
    () => false,
  );
}

/**
 * Start the keep-alive foreground service (if not already running) or, if it
 * is running, refresh the foreground-service notification text in place.
 *
 * IMPORTANT: a location foreground service can only be *started* while the app
 * is in the foreground (Android 12+ forbids starting one from the background).
 * So callers must invoke this for the first time while the app is active —
 * which we do, the moment the rider opens the tracking view for a running
 * trip. Re-invoking it later (even from the background) only reconfigures the
 * already-running service, which is permitted, so the notification text can be
 * kept current as the ETA changes.
 *
 * Returns true if the service is running after the call.
 */
export async function startOrUpdateTrackingNotification(
  content: TrackingNotificationContent,
): Promise<boolean> {
  // Collapse re-entrant calls (rapid socket updates) while a start is mid-flight.
  if (starting) return isTrackingServiceRunning();

  const alreadyRunning = await isTrackingServiceRunning();
  // Nothing changed and it's already running — skip the native round-trip.
  if (alreadyRunning && content.body === lastBody) return true;

  starting = true;
  try {
    await Location.startLocationUpdatesAsync(PASSENGER_KEEPALIVE_TASK, {
      // We do not need the location data, so use the lowest-power settings
      // that still keep a valid location foreground service alive.
      accuracy: Location.Accuracy.Lowest,
      timeInterval: 30_000,
      distanceInterval: 200,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: content.title,
        notificationBody: content.body,
        notificationColor: NOTIFICATION_COLOR,
        // Tear the service (and its notification) down if the OS destroys the
        // task, so a stale "tracking" notification can never get stuck.
        killServiceOnDestroy: true,
      },
    });
    lastBody = content.body;
    return true;
  } catch {
    // Most commonly: tried to (re)start from the background, or permission
    // was revoked. Non-fatal — server push still covers the rider.
    return isTrackingServiceRunning();
  } finally {
    starting = false;
  }
}

export async function stopTrackingNotification(): Promise<void> {
  lastBody = null;
  if (await isTrackingServiceRunning()) {
    await Location.stopLocationUpdatesAsync(PASSENGER_KEEPALIVE_TASK).catch(
      () => undefined,
    );
  }
}
