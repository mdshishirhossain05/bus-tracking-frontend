import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  deleteStopSubscription,
  listStopSubscriptions,
  upsertStopSubscription,
  type StopSubscription,
} from "@ubts/shared";

/**
 * Owns the user's stop-alert subscriptions across the app: an in-memory
 * Set of (routeId|stopId) keys for the cheap subscribed?-check that the
 * StopTimeline does on every render, plus a single toggle entry point
 * that optimistically flips the local state before hitting the server.
 */
export function useStopSubscriptions() {
  const [subs, setSubs] = useState<StopSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const inflight = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    try {
      const data = await listStopSubscriptions();
      setSubs(data);
    } catch {
      // Subscription list is non-critical; users can retry from the
      // notification preferences screen.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const sub of subs) {
      if (sub.enabled) keys.add(`${sub.routeId}|${sub.stopId}`);
    }
    return keys;
  }, [subs]);

  const isSubscribed = useCallback(
    (routeId: string, stopId: string) =>
      subscribedKeys.has(`${routeId}|${stopId}`),
    [subscribedKeys],
  );

  const toggle = useCallback(
    async (params: { routeId: string; stopId: string; stopName?: string }) => {
      const key = `${params.routeId}|${params.stopId}`;
      if (inflight.current.has(key)) return;
      inflight.current.add(key);

      const currentlySubscribed = subscribedKeys.has(key);
      void Haptics.selectionAsync();

      // Optimistic update.
      if (currentlySubscribed) {
        setSubs((prev) =>
          prev.filter(
            (s) =>
              !(s.routeId === params.routeId && s.stopId === params.stopId),
          ),
        );
      } else {
        setSubs((prev) => [
          {
            id: `tmp-${key}`,
            stopId: params.stopId,
            stopName: params.stopName ?? "",
            routeId: params.routeId,
            routeName: "",
            leadTimeMinutes: 5,
            enabled: true,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      try {
        if (currentlySubscribed) {
          await deleteStopSubscription(params.routeId, params.stopId);
        } else {
          await upsertStopSubscription({
            routeId: params.routeId,
            stopId: params.stopId,
          });
        }
        // Re-pull to replace the optimistic tmp row with the real one
        // (and to surface any server-side normalization).
        await refresh();
      } catch {
        // Rollback on failure.
        await refresh();
      } finally {
        inflight.current.delete(key);
      }
    },
    [refresh, subscribedKeys],
  );

  return { subs, loading, isSubscribed, toggle, refresh };
}
