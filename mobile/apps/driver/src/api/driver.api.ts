import { api, unwrap, type TripPreTripPhase } from "@ubts/shared";

export type TrackingSource = "DRIVER_MOBILE" | "GPS_DEVICE";

export type DriverTripStatus =
  | "PLANNED"
  | "PRE_TRIP"
  | "RUNNING"
  | "ENDED";

export interface DriverTrip {
  tripId: string;
  routeId: string | null;
  routeName: string | null;
  busLabel: string | null;
  status: DriverTripStatus;
  startedAt: string | null;
  etaMinutes: number | null;
  nextStopName: string | null;
  latitude: number | null;
  longitude: number | null;
  preTripPhase: TripPreTripPhase | null;
  preTripStartedAt: string | null;
  originArrivedAt: string | null;
}

function uuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function s(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function n(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const x = Number(value);
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

function normalizeStatus(value: unknown): DriverTripStatus {
  const raw = s(value);
  if (
    raw === "PLANNED" ||
    raw === "PRE_TRIP" ||
    raw === "RUNNING" ||
    raw === "ENDED"
  ) {
    return raw;
  }
  return "PLANNED";
}

function normalizePhase(value: unknown): TripPreTripPhase | null {
  const raw = s(value);
  if (
    raw === "AT_DEPOT" ||
    raw === "APPROACHING_ORIGIN" ||
    raw === "AT_ORIGIN"
  ) {
    return raw;
  }
  return null;
}

function normalizeTrip(raw: any): DriverTrip | null {
  if (!raw) return null;
  const tripId = s(raw.tripId ?? raw.id);
  if (!tripId) return null;
  const live = raw.live ?? raw.location ?? raw;
  const eta = raw.eta ?? {};
  return {
    tripId,
    routeId: s(raw.routeId ?? raw.route?.id),
    routeName: s(raw.routeName ?? raw.route?.routeName ?? raw.route?.name),
    busLabel: s(
      raw.busLabel ??
        raw.bus?.busCode ??
        raw.bus?.plateNumber ??
        raw.bus?.label ??
        raw.bus?.busNumber,
    ),
    status: normalizeStatus(raw.status),
    startedAt: s(raw.startedAt ?? raw.startTime),
    etaMinutes: n(eta?.etaMinutes ?? eta?.minutes ?? raw.lastEtaMinutes),
    nextStopName: s(
      eta?.nextStopName ?? eta?.nextStop?.stopName ?? raw.nextStopName,
    ),
    latitude: n(live?.latitude ?? live?.lat ?? raw.lastLatitude),
    longitude: n(live?.longitude ?? live?.lng ?? raw.lastLongitude),
    preTripPhase: normalizePhase(raw.preTripPhase),
    preTripStartedAt: s(raw.preTripStartedAt),
    originArrivedAt: s(raw.originArrivedAt),
  };
}

export async function getCurrentTrip(): Promise<DriverTrip | null> {
  const res = await api.get("/driver/trips/current");
  return normalizeTrip(unwrap(res.data));
}

export async function startTrip(
  preferredSourceType?: TrackingSource,
): Promise<DriverTrip | null> {
  const body = preferredSourceType ? { preferredSourceType } : {};
  const res = await api.post("/driver/trips/start", body, {
    headers: { "Idempotency-Key": uuidV4() },
  });
  const data = unwrap<any>(res.data);
  return normalizeTrip(data?.trip ?? data);
}

export async function endTrip(tripId: string): Promise<void> {
  await api.post(
    `/driver/trips/${tripId}/end`,
    {},
    { headers: { "Idempotency-Key": uuidV4() } },
  );
}
