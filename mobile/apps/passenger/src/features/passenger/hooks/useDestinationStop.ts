import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import type { RouteStop, TripEta } from "@ubts/shared";

export type DestinationAlertState =
  | { kind: "idle" }
  | { kind: "approaching"; stopName: string }
  | { kind: "arrived"; stopName: string };

/**
 * Get-off-here reminder: the passenger picks a destination stop on the
 * route, and we surface a clearly-tinted banner + haptic when the bus
 * is closing in on it (next stop OR ETA <= 2 min). The banner sticks
 * until the passenger clears it OR the bus has passed the destination.
 *
 * Scoped per trip so switching trips doesn't carry a stale destination
 * forward. Persistence across app restarts is intentionally OUT — the
 * destination matters only for the trip you're currently watching.
 */
export function useDestinationStop({
  tripId,
  eta,
  routeStops,
}: {
  tripId: string | null;
  eta: TripEta | null;
  routeStops: RouteStop[] | null | undefined;
}) {
  const [destinationStopId, setDestinationStopIdState] = useState<string | null>(
    null,
  );
  const [alert, setAlert] = useState<DestinationAlertState>({ kind: "idle" });
  const lastTripIdRef = useRef<string | null>(null);
  const lastAlertedKey = useRef<string | null>(null);

  // Reset when the selected trip changes so we don't carry a destination
  // from one trip onto another.
  useEffect(() => {
    if (lastTripIdRef.current !== tripId) {
      lastTripIdRef.current = tripId;
      setDestinationStopIdState(null);
      setAlert({ kind: "idle" });
      lastAlertedKey.current = null;
    }
  }, [tripId]);

  const setDestination = useCallback((stopId: string | null) => {
    void Haptics.selectionAsync();
    setDestinationStopIdState(stopId);
    setAlert({ kind: "idle" });
    lastAlertedKey.current = null;
  }, []);

  const clearAlert = useCallback(() => {
    setAlert({ kind: "idle" });
  }, []);

  // Watch ETA → fire the alert when the bus is approaching or has
  // reached the destination stop.
  useEffect(() => {
    if (!destinationStopId || !routeStops) return;
    const destStop = routeStops.find((s) => s.id === destinationStopId);
    if (!destStop) return;

    const nextStopName = eta?.nextStopName ?? null;
    const etaMinutes = eta?.etaMinutes ?? null;

    // Approaching = next stop is the destination AND ETA <= 2 min
    // (or null/unknown — better to warn early than miss the stop).
    const approaching =
      nextStopName === destStop.name &&
      (etaMinutes == null || etaMinutes <= 2);

    // Arrived = ETA is 0 or negative AND next stop is our destination.
    const arrived =
      nextStopName === destStop.name && etaMinutes != null && etaMinutes <= 0;

    if (arrived) {
      const key = `arrived:${destStop.id}`;
      if (lastAlertedKey.current !== key) {
        lastAlertedKey.current = key;
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        setAlert({ kind: "arrived", stopName: destStop.name });
      }
      return;
    }

    if (approaching) {
      const key = `approaching:${destStop.id}`;
      if (lastAlertedKey.current !== key) {
        lastAlertedKey.current = key;
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        setAlert({ kind: "approaching", stopName: destStop.name });
      }
      return;
    }

    // Bus passed the destination → clear silently so the banner isn't
    // misleading "your stop is coming" after they've gone past.
    if (nextStopName && destStop.name && nextStopName !== destStop.name) {
      const nextIdx = routeStops.findIndex((s) => s.name === nextStopName);
      const destIdx = routeStops.findIndex((s) => s.id === destStop.id);
      if (nextIdx > -1 && destIdx > -1 && nextIdx > destIdx) {
        setAlert({ kind: "idle" });
      }
    }
  }, [destinationStopId, eta?.etaMinutes, eta?.nextStopName, routeStops]);

  const isDestination = useCallback(
    (stopId: string) => destinationStopId === stopId,
    [destinationStopId],
  );

  return {
    destinationStopId,
    setDestination,
    clearDestination: () => setDestination(null),
    isDestination,
    alert,
    clearAlert,
  };
}
