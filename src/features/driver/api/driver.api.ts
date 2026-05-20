import { api } from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface SendLocationPayload {
  lat: number;
  lng: number;
  speedKmh?: number | null;
  heading?: number | null;
  accuracyM?: number | null;
  recordedAt?: string | null;
}

function buildIdempotencyKey(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type DriverStartTripPreferredSource = "DRIVER_MOBILE" | "GPS_DEVICE";

export async function startTrip(
  preferredSourceType?: DriverStartTripPreferredSource | null,
) {
  const body = preferredSourceType ? { preferredSourceType } : {};

  const res = await api.post(API_ENDPOINTS.driver.startTrip, body, {
    headers: {
      "Idempotency-Key": buildIdempotencyKey("start-trip"),
    },
  });

  return res.data?.data ?? res.data;
}

export async function sendDriverLocation(
  tripId: string,
  payload: SendLocationPayload,
) {
  const res = await api.post(
    API_ENDPOINTS.driver.sendLocation(tripId),
    payload,
  );
  return res.data?.data ?? res.data;
}

export async function endTrip(tripId: string) {
  const res = await api.post(
    API_ENDPOINTS.driver.endTrip(tripId),
    {},
    {
      headers: {
        "Idempotency-Key": buildIdempotencyKey("end-trip"),
      },
    },
  );

  return res.data?.data ?? res.data;
}
