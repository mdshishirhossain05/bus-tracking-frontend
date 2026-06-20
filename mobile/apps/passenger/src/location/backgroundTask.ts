import * as TaskManager from "expo-task-manager";
import { PASSENGER_KEEPALIVE_TASK } from "./trackingService";

// Registered at the global scope (imported from index.ts before the app
// mounts) so the OS can invoke the keep-alive location task even when the
// app's UI isn't mounted.
//
// The passenger app never broadcasts its own location — this task exists
// only so `expo-location` will run a foreground service that keeps the JS
// runtime (and therefore the live trip socket + notification refresh logic)
// alive while the app is backgrounded. We deliberately discard the fixes.
TaskManager.defineTask(PASSENGER_KEEPALIVE_TASK, async () => {
  // No-op: we do not use the passenger's location for anything.
});
