import * as TaskManager from "expo-task-manager";
import type { LocationObject } from "expo-location";
import { DRIVER_LOCATION_TASK, postLocationFix } from "./driverLocation";

type LocationTaskData = { locations?: LocationObject[] };

// Registered at the global scope (imported from index.ts before the app
// mounts) so the OS can invoke it for background fixes even when no UI exists.
TaskManager.defineTask<LocationTaskData>(
  DRIVER_LOCATION_TASK,
  async ({ data, error }) => {
    if (error || !data?.locations?.length) return;

    // Only the freshest fix matters; the OS may batch several.
    const fix = data.locations[data.locations.length - 1];

    try {
      await postLocationFix(fix.coords, fix.timestamp);
    } catch {
      // A dropped fix is non-fatal — the next one (and the server's stale
      // handling) recovers. Never throw out of a background task.
    }
  },
);
