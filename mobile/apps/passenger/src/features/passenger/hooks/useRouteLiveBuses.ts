import { useCallback, useEffect, useState } from "react";
import type { RouteLiveBus } from "@ubts/shared";
import { getRouteLiveBuses } from "../api/favorites.api";

const REFRESH_MS = 20_000;

/**
 * Polls `/passenger/routes/{routeId}/live-buses` every 20s so the
 * passenger sees every active bus on the same route, ranked by ETA.
 *
 * Polling (not socket) is intentional here: the per-bus live socket
 * room only knows about ONE trip at a time, and the multi-bus card
 * is updated coarsely enough that 20s cadence feels live without
 * piling on socket subscriptions.
 */
export function useRouteLiveBuses(routeId: string | null | undefined) {
  const [buses, setBuses] = useState<RouteLiveBus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNow = useCallback(async (rid: string) => {
    setLoading(true);
    try {
      const data = await getRouteLiveBuses(rid);
      setBuses(data);
    } catch {
      // Non-critical surface; leave previous state on error.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!routeId) {
      setBuses([]);
      return;
    }
    void fetchNow(routeId);
    const id = setInterval(() => {
      void fetchNow(routeId);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchNow, routeId]);

  return { buses, loading };
}
