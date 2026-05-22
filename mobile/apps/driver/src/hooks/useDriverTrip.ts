import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { getCurrentTrip, startTrip, endTrip, type DriverTrip } from "../api/driver.api";
import {
  ensureLocationPermissions,
  isStreaming,
  startStreaming,
  stopStreaming,
} from "../location/driverLocation";

export interface DriverFix {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  speedKmh: number | null;
  heading: number | null;
  at: number;
}

export function useDriverTrip() {
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastFix, setLastFix] = useState<DriverFix | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [current, streamingNow] = await Promise.all([
          getCurrentTrip(),
          isStreaming(),
        ]);
        if (!active) return;
        setTrip(current);
        setStreaming(streamingNow && current?.status === "RUNNING");
      } catch (e: any) {
        if (active) {
          setError(e?.response?.data?.message ?? "Failed to load your trip.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Foreground watch is display-only — the background task owns the actual
  // posting, so this never double-sends.
  useEffect(() => {
    if (!streaming) {
      setLastFix(null);
      return;
    }
    let sub: Location.LocationSubscription | null = null;
    let active = true;
    (async () => {
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 3,
        },
        (pos) => {
          if (!active) return;
          setLastFix({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyM: pos.coords.accuracy ?? null,
            speedKmh:
              pos.coords.speed != null && pos.coords.speed >= 0
                ? pos.coords.speed * 3.6
                : null,
            heading: pos.coords.heading ?? null,
            at: pos.timestamp,
          });
        },
      );
    })();
    return () => {
      active = false;
      sub?.remove();
    };
  }, [streaming]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    setPermissionDenied(false);
    try {
      const granted = await ensureLocationPermissions();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      const started = (await startTrip()) ?? (await getCurrentTrip());
      if (!started) {
        throw new Error(
          "Could not start a trip — check your bus and route assignment.",
        );
      }
      await startStreaming(started.tripId);
      setTrip(started);
      setStreaming(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Failed to start the trip.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const end = useCallback(async () => {
    if (!trip) return;
    setBusy(true);
    setError(null);
    try {
      await endTrip(trip.tripId);
      await stopStreaming();
      setStreaming(false);
      setTrip({ ...trip, status: "ENDED" });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to end the trip.");
    } finally {
      setBusy(false);
    }
  }, [trip]);

  return {
    loading,
    trip,
    streaming,
    busy,
    error,
    permissionDenied,
    lastFix,
    start,
    end,
  };
}
