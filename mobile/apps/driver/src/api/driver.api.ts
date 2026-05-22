import { api, unwrap } from "@ubts/shared";

export interface DriverTrip {
  tripId: string;
  routeId: string | null;
  routeName: string | null;
  busLabel: string | null;
  status: string;
  startedAt: string | null;
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

function normalizeTrip(raw: any): DriverTrip | null {
  if (!raw) return null;
  const tripId = s(raw.tripId ?? raw.id);
  if (!tripId) return null;
  return {
    tripId,
    routeId: s(raw.routeId ?? raw.route?.id),
    routeName: s(raw.routeName ?? raw.route?.name),
    busLabel: s(raw.busLabel ?? raw.bus?.label ?? raw.bus?.busNumber),
    status: s(raw.status) ?? "PLANNED",
    startedAt: s(raw.startedAt ?? raw.startTime),
  };
}

export async function getCurrentTrip(): Promise<DriverTrip | null> {
  const res = await api.get("/driver/trips/current");
  return normalizeTrip(unwrap(res.data));
}

export async function startTrip(): Promise<DriverTrip | null> {
  const res = await api.post(
    "/driver/trips/start",
    {},
    { headers: { "Idempotency-Key": uuidV4() } },
  );
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
