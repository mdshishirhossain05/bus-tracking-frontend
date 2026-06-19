import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  ensureBackgroundPermissions,
  startOrUpdateTrackingNotification,
  stopTrackingNotification,
} from "../../../location/trackingService";

interface Options {
  /** True only while the rider is actively watching a RUNNING trip. */
  enabled: boolean;
  /** Notification title — typically the bus label or route name. */
  title: string;
  /** Notification body — the live status line (next stop · ETA · speed). */
  body: string;
}

/**
 * Keeps a "live tracking" foreground-service notification on screen — like a
 * navigation app — for as long as the rider is actively tracking a running
 * trip, so the bus status stays visible (and the trip socket stays alive)
 * when they leave the app.
 *
 * Lifecycle:
 *   • When `enabled` turns true we request background-location permission and
 *     start the keep-alive foreground service. This MUST happen while the app
 *     is foregrounded (it is — the rider just opened the tracking view), since
 *     Android forbids starting a foreground service from the background.
 *   • While running, we refresh the notification text whenever `body` changes
 *     (works in the background because the service keeps JS alive).
 *   • When `enabled` turns false, the trip ends, or the screen unmounts, we
 *     stop the service and clear the notification.
 *
 * If the rider declines background-location permission we simply never start
 * the service; the backend's push notifications still cover the key moments.
 */
export function useBackgroundTrackingNotification({
  enabled,
  title,
  body,
}: Options) {
  // Whether we have an active (or pending) foreground service for this session.
  const activeRef = useRef(false);
  // Latest content, read by the deferred refresh so we never show stale text.
  const contentRef = useRef({ title, body });
  contentRef.current = { title, body };

  // Start / stop the service as `enabled` flips.
  useEffect(() => {
    let cancelled = false;

    if (enabled) {
      (async () => {
        const granted = await ensureBackgroundPermissions();
        if (cancelled || !granted) return;
        const ok = await startOrUpdateTrackingNotification(contentRef.current);
        if (!cancelled) activeRef.current = ok;
      })();
    } else if (activeRef.current) {
      activeRef.current = false;
      void stopTrackingNotification();
    }

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Refresh the notification text as the live status changes.
  useEffect(() => {
    if (!enabled || !activeRef.current) return;
    void startOrUpdateTrackingNotification({ title, body });
  }, [enabled, title, body]);

  // Belt-and-braces: when the app returns to the foreground, push the freshest
  // text in case a background refresh was throttled by the OS.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && enabled && activeRef.current) {
        void startOrUpdateTrackingNotification(contentRef.current);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  // Final cleanup on unmount — never leave a stuck "tracking" notification.
  useEffect(() => {
    return () => {
      if (activeRef.current) {
        activeRef.current = false;
        void stopTrackingNotification();
      }
    };
  }, []);
}
