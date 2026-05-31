import { haversineMeters } from "@ubts/shared";
import type { RouteStop } from "@ubts/shared";

export function orderStops(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.order - b.order);
}

export interface TripProgress {
  nextIndex: number;
  distanceToNextM: number | null;
  stopsDone: number;
  total: number;
}

/**
 * Where the bus is along its route: which stop is next (by the backend's
 * next-stop name, falling back to the nearest stop to the live position),
 * how far that stop is, and how many stops are behind it.
 */
export function computeTripProgress(params: {
  stops: RouteStop[];
  nextStopName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): TripProgress {
  const stops = orderStops(params.stops);
  const total = stops.length;
  if (!total) return { nextIndex: -1, distanceToNextM: null, stopsDone: 0, total: 0 };

  let nextIndex = -1;
  if (params.nextStopName) {
    const n = params.nextStopName.trim().toLowerCase();
    nextIndex = stops.findIndex((s) => s.name.trim().toLowerCase() === n);
  }
  if (nextIndex < 0 && params.latitude != null && params.longitude != null) {
    let best = -1;
    let bestD = Infinity;
    stops.forEach((s, i) => {
      const d = haversineMeters(
        params.latitude as number,
        params.longitude as number,
        s.latitude,
        s.longitude,
      );
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    nextIndex = best;
  }

  const distanceToNextM =
    nextIndex >= 0 && params.latitude != null && params.longitude != null
      ? haversineMeters(
          params.latitude,
          params.longitude,
          stops[nextIndex].latitude,
          stops[nextIndex].longitude,
        )
      : null;

  return { nextIndex, distanceToNextM, stopsDone: Math.max(0, nextIndex), total };
}
