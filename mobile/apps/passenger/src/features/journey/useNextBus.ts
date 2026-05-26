import { useEffect, useRef, useState } from "react";
import type { RoutePresentation } from "@ubts/shared";
import { getRoutePresentation } from "../passenger/api/passenger.api";
import { getFavorites, getRouteLiveBuses } from "../passenger/api/favorites.api";
import { orderStops, nearestStopId, pickBestBus, type JourneyStatus } from "./journey";
import { usePassengerLocation } from "./usePassengerLocation";

export interface NextBus {
  routeId: string;
  routeName: string;
  stopName: string;
  journey: JourneyStatus;
}

const POLL_MS = 7000;

/**
 * Across the passenger's favorite routes, the single most imminent bus to
 * their nearest stop — the "your next bus" headline shown on the home map.
 */
export function useNextBus(): NextBus | null {
  const { coords, ready } = usePassengerLocation();
  const [result, setResult] = useState<NextBus | null>(null);
  const presCache = useRef<Map<string, RoutePresentation>>(new Map());

  useEffect(() => {
    if (!ready) return;
    let active = true;

    const tick = async () => {
      try {
        const favorites = await getFavorites();
        if (!favorites.length) {
          if (active) setResult(null);
          return;
        }

        let bestOverall: NextBus | null = null;

        for (const fav of favorites) {
          let pres = presCache.current.get(fav.routeId);
          if (!pres) {
            const fetched = await getRoutePresentation(fav.routeId).catch(
              () => null,
            );
            if (fetched) {
              pres = fetched;
              presCache.current.set(fav.routeId, fetched);
            }
          }
          if (!pres) continue;

          const stops = orderStops(pres.stops);
          if (!stops.length) continue;

          const myStopId = coords
            ? nearestStopId(stops, coords.latitude, coords.longitude)
            : stops[0].id;
          const buses = await getRouteLiveBuses(fav.routeId).catch(() => []);
          const best = pickBestBus(stops, buses, myStopId);

          if (
            best &&
            (best.journey.state === "before" ||
              best.journey.state === "approaching") &&
            best.journey.etaMin != null
          ) {
            const candidate: NextBus = {
              routeId: fav.routeId,
              routeName: fav.routeName,
              stopName: stops.find((s) => s.id === myStopId)?.name ?? "",
              journey: best.journey,
            };
            if (
              !bestOverall ||
              (bestOverall.journey.etaMin ?? Infinity) >
                (best.journey.etaMin ?? Infinity)
            ) {
              bestOverall = candidate;
            }
          }
        }

        if (active) setResult(bestOverall);
      } catch {
        // Best-effort; the banner simply hides until the next tick succeeds.
      }
    };

    void tick();
    const interval = setInterval(() => void tick(), POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [coords, ready]);

  return result;
}
