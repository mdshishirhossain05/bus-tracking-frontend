import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  connectSocket,
  getOccupancy,
  SOCKET_EVENTS,
  voteOccupancy,
  type OccupancyAggregate,
  type OccupancyLevel,
} from "@ubts/shared";

const EMPTY: OccupancyAggregate = {
  tripId: "",
  level: null,
  voteCount: 0,
  counts: { LIGHT: 0, MODERATE: 0, FULL: 0 },
  myVote: null,
};

/**
 * Owns the occupancy aggregate for one trip: initial fetch, live
 * subscription via the trip's socket room, and the vote() action with
 * optimistic update + haptic.
 */
export function useTripOccupancy(tripId: string | null | undefined) {
  const [aggregate, setAggregate] = useState<OccupancyAggregate>({
    ...EMPTY,
    tripId: tripId ?? "",
  });
  const [busy, setBusy] = useState(false);
  const aggRef = useRef(aggregate);
  aggRef.current = aggregate;

  // Initial load. We refetch whenever the tripId changes so switching trips
  // in the sheet resets the view.
  useEffect(() => {
    if (!tripId) {
      setAggregate({ ...EMPTY, tripId: "" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const next = await getOccupancy(tripId);
        if (!cancelled) setAggregate(next);
      } catch {
        if (!cancelled) setAggregate({ ...EMPTY, tripId });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // Socket subscription: when *anyone* votes on this trip, the server
  // broadcasts the new aggregate. We layer the user's own vote on top
  // (the broadcast doesn't carry it) so the chosen pill stays highlighted.
  useEffect(() => {
    if (!tripId) return;
    const socket = connectSocket();
    const handler = (payload: any) => {
      if (payload?.tripId !== tripId) return;
      setAggregate((prev) => ({
        tripId,
        level: payload?.level ?? null,
        voteCount:
          typeof payload?.voteCount === "number" ? payload.voteCount : 0,
        counts:
          payload?.counts && typeof payload.counts === "object"
            ? payload.counts
            : prev.counts,
        myVote: prev.myVote,
      }));
    };
    socket.on(SOCKET_EVENTS.TRIP_OCCUPANCY_UPDATED, handler);
    return () => {
      socket.off(SOCKET_EVENTS.TRIP_OCCUPANCY_UPDATED, handler);
    };
  }, [tripId]);

  const vote = useCallback(
    async (level: OccupancyLevel) => {
      if (!tripId || busy) return;
      const previous = aggRef.current;
      // Optimistic flip of the user's own vote so the pill highlights instantly.
      setAggregate((prev) => ({ ...prev, myVote: level }));
      setBusy(true);
      try {
        const next = await voteOccupancy(tripId, level);
        setAggregate(next);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        setAggregate(previous);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, tripId],
  );

  return { aggregate, vote, busy };
}
