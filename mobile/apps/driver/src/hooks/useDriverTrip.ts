import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import {
  getCurrentTrip,
  startTrip,
  endTrip,
  type DriverTrip,
  type TrackingSource,
} from "../api/driver.api";
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

/**
 * A trip is "broadcast-eligible" when the bus should be publishing live
 * location updates. That's true for any trip the backend will accept
 * location for: PRE_TRIP (window opened ahead of departure) and RUNNING.
 */
function shouldBroadcast(trip: DriverTrip | null): boolean {
  return trip?.status === "PRE_TRIP" || trip?.status === "RUNNING";
}

export function useDriverTrip() {
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [lastFix, setLastFix] = useState<DriverFix | null>(null);
  const [preferredSource, setPreferredSource] =
    useState<TrackingSource>("DRIVER_MOBILE");

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
        // Sync the in-memory streaming flag with the OS task state, but only
        // consider the trip-status side broadcast-eligible (PRE_TRIP or RUNNING).
        setStreaming(streamingNow && shouldBroadcast(current));
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

  // Auto-start broadcasting when the trip enters PRE_TRIP (or RUNNING via
  // a status promotion). This is what makes "the bus pin shows up before
  // the driver taps Start" possible: as soon as the pre-trip window opens
  // on the server, the next /trips/current poll lights up streaming.
  useEffect(() => {
    if (loading) return;
    if (!shouldBroadcast(trip)) return;
    if (streaming) return;
    if (busy) return;

    let cancelled = false;
    (async () => {
      try {
        const granted = await ensureLocationPermissions();
        if (cancelled) return;
        if (!granted) {
          setPermissionDenied(true);
          return;
        }
        await startStreaming(trip!.tripId);
        if (cancelled) return;
        setStreaming(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ??
              e?.message ??
              "Failed to start broadcasting.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, trip, streaming, busy]);

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

  // While broadcast-eligible, refresh the trip snapshot so phase / ETA /
  // status promotions surface in the UI (the foreground watch keeps the
  // map pin live separately). Faster cadence during PRE_TRIP so the
  // auto-promote on origin-dwell shows up quickly.
  useEffect(() => {
    if (!shouldBroadcast(trip)) return;
    const intervalMs = trip?.status === "PRE_TRIP" ? 5000 : 15000;
    const id = setInterval(async () => {
      try {
        const current = await getCurrentTrip();
        if (current) setTrip(current);
      } catch {
        // transient; next tick retries
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [trip?.status]);

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
      // Backend handles all three cases here:
      //   * No current trip → create + RUNNING
      //   * PRE_TRIP for this driver → promote to RUNNING in place
      //   * Already RUNNING → no-op (idempotent return of current trip)
      const started =
        (await startTrip(preferredSource)) ?? (await getCurrentTrip());
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
  }, [preferredSource]);

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
    preferredSource,
    setPreferredSource,
    start,
    end,
  };
}
