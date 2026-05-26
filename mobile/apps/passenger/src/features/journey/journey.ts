import { haversineMeters, estimateMinutes } from "@ubts/shared";
import type { RouteLiveBus, RouteStop } from "@ubts/shared";

export type JourneyState =
  | "before"
  | "approaching"
  | "passed"
  | "ended"
  | "unknown";

export interface JourneyStatus {
  state: JourneyState;
  etaMin: number | null;
  stopsAway: number | null;
  busIndex: number | null;
  myIndex: number;
  headline: string;
  detail: string;
  confidence: string | null;
}

const MIN_SPEED_KMH = 8;

export function orderStops(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.order - b.order);
}

function matchStopIndex(stops: RouteStop[], name?: string | null): number {
  if (!name) return -1;
  const n = name.trim().toLowerCase();
  return stops.findIndex((s) => s.name.trim().toLowerCase() === n);
}

function nearestIndexToPoint(
  stops: RouteStop[],
  lat: number,
  lng: number,
): number {
  let best = -1;
  let bestD = Infinity;
  stops.forEach((s, i) => {
    const d = haversineMeters(lat, lng, s.latitude, s.longitude);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Closest stop to a coordinate — used to auto-pick the passenger's stop. */
export function nearestStopId(
  stops: RouteStop[],
  lat: number,
  lng: number,
): string | null {
  const ordered = orderStops(stops);
  const i = nearestIndexToPoint(ordered, lat, lng);
  return i >= 0 ? ordered[i].id : null;
}

function buildDetail(
  stops: RouteStop[],
  busIndex: number,
  myIndex: number,
  stopsAway: number,
  near?: string | null,
): string {
  // busIndex === 0 means the bus's next stop is the first stop — i.e. it has
  // started its trip but is still on its way to the route's starting point.
  if (busIndex === 0) {
    const origin = stops[0]?.name;
    const where = origin ? ` (${origin})` : "";
    if (myIndex === 0) return `On its way to the first stop${where} — your stop`;
    return `Heading to the first stop${where} · ${stopsAway} stop${stopsAway > 1 ? "s" : ""} to you`;
  }

  const base =
    stopsAway <= 0
      ? "Your stop is next"
      : `${stopsAway} stop${stopsAway > 1 ? "s" : ""} away`;
  return near ? `${base} · bus near ${near}` : base;
}

/** Turns a bus's live state into a passenger-facing journey status for one stop. */
export function computeJourney(params: {
  stops: RouteStop[];
  myStopId: string | null;
  bus: RouteLiveBus;
}): JourneyStatus | null {
  const stops = orderStops(params.stops);
  if (!stops.length || !params.myStopId) return null;
  const myIndex = stops.findIndex((s) => s.id === params.myStopId);
  if (myIndex < 0) return null;

  const bus = params.bus;
  const avg = bus.avgSpeedKmh ?? bus.speedKmh ?? null;
  const speed = avg != null && avg >= MIN_SPEED_KMH ? avg : MIN_SPEED_KMH;

  let busIndex = matchStopIndex(stops, bus.nextStopName);
  if (busIndex < 0) busIndex = matchStopIndex(stops, bus.nearestStopName);
  if (busIndex < 0 && bus.latitude != null && bus.longitude != null) {
    busIndex = nearestIndexToPoint(stops, bus.latitude, bus.longitude);
  }

  const conf = bus.confidence ?? null;

  if (bus.finalStopReached) {
    return {
      state: busIndex > myIndex ? "passed" : "ended",
      etaMin: null,
      stopsAway: null,
      busIndex: busIndex >= 0 ? busIndex : null,
      myIndex,
      headline: "Trip finished",
      detail: "This bus has completed its route.",
      confidence: conf,
    };
  }

  if (busIndex < 0) {
    return {
      state: "unknown",
      etaMin: null,
      stopsAway: null,
      busIndex: null,
      myIndex,
      headline: "Bus is live",
      detail: bus.nearestStopName
        ? `Near ${bus.nearestStopName}`
        : "Locating along the route…",
      confidence: conf,
    };
  }

  if (busIndex > myIndex) {
    return {
      state: "passed",
      etaMin: null,
      stopsAway: null,
      busIndex,
      myIndex,
      headline: "Bus passed your stop",
      detail: bus.nearestStopName
        ? `Now near ${bus.nearestStopName}`
        : "It is ahead of your stop.",
      confidence: conf,
    };
  }

  // The bus is at or before the passenger's stop — sum the remaining distance.
  let meters =
    bus.nextStopDistanceMeters != null
      ? bus.nextStopDistanceMeters
      : bus.latitude != null && bus.longitude != null
        ? haversineMeters(
            bus.latitude,
            bus.longitude,
            stops[busIndex].latitude,
            stops[busIndex].longitude,
          )
        : 0;
  for (let i = busIndex; i < myIndex; i++) {
    meters += haversineMeters(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude,
    );
  }

  const stopsAway = myIndex - busIndex;
  const eta =
    busIndex === myIndex && bus.etaMinutes != null
      ? bus.etaMinutes
      : estimateMinutes(meters, speed);
  const approaching = eta <= 2 || stopsAway <= 1;

  return {
    state: approaching ? "approaching" : "before",
    etaMin: eta,
    stopsAway,
    busIndex,
    myIndex,
    headline: approaching ? "Arriving now" : `~${eta} min to your stop`,
    detail: buildDetail(stops, busIndex, myIndex, stopsAway, bus.nearestStopName),
    confidence: conf,
  };
}

export interface BusJourney {
  bus: RouteLiveBus;
  journey: JourneyStatus;
}

/** Among live buses, the one arriving soonest at the passenger's stop. */
export function pickBestBus(
  stops: RouteStop[],
  buses: RouteLiveBus[],
  myStopId: string | null,
): BusJourney | null {
  let best: BusJourney | null = null;
  let fallback: BusJourney | null = null;

  for (const bus of buses) {
    const journey = computeJourney({ stops, myStopId, bus });
    if (!journey) continue;
    if (!fallback) fallback = { bus, journey };
    if (
      (journey.state === "before" || journey.state === "approaching") &&
      journey.etaMin != null
    ) {
      if (!best || journey.etaMin < (best.journey.etaMin ?? Infinity)) {
        best = { bus, journey };
      }
    }
  }

  return best ?? fallback;
}
