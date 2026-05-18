"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentDriverTrip } from "@/features/driver/api/driver.current.api";
import type { DriverCurrentTrip } from "@/features/driver/types.current";

type LoadMode = "initial" | "refresh" | "silent";

export function useDriverCurrentTrip() {
  const mountedRef = useRef(false);
  const requestSeqRef = useRef(0);
  const lastGoodTripRef = useRef<DriverCurrentTrip | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trip, setTrip] = useState<DriverCurrentTrip | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (mode: LoadMode = "refresh") => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    const isInitial = mode === "initial";
    const isRefresh = mode === "refresh";

    if (isInitial && !lastGoodTripRef.current) {
      setLoading(true);
    }

    if (isRefresh) {
      setRefreshing(true);
    }

    setError("");

    try {
      const data = await getCurrentDriverTrip();

      if (!mountedRef.current || requestSeq !== requestSeqRef.current) {
        return lastGoodTripRef.current;
      }

      const nextTrip = data ?? null;

      lastGoodTripRef.current = nextTrip;
      setTrip(nextTrip);

      return nextTrip;
    } catch (err: any) {
      console.error(err);

      if (!mountedRef.current || requestSeq !== requestSeqRef.current) {
        return lastGoodTripRef.current;
      }

      /*
       * Keep the last good trip mounted on refresh failure.
       * This prevents the driver live page from blinking or falling back to
       * a skeleton while GPS publishing is active.
       */
      setTrip(lastGoodTripRef.current);
      setError(
        err?.response?.data?.message || "Failed to load current driver trip.",
      );

      return lastGoodTripRef.current;
    } finally {
      if (!mountedRef.current || requestSeq !== requestSeqRef.current) {
        return;
      }

      if (isInitial) {
        setLoading(false);
      }

      if (isRefresh) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load("initial");

    return () => {
      mountedRef.current = false;
      requestSeqRef.current += 1;
    };
  }, [load]);

  return {
    loading: loading && !trip,
    refreshing,
    trip,
    error,
    refresh: () => load("refresh"),
    silentRefresh: () => load("silent"),
  };
}
