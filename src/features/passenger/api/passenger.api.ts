import { api } from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  normalizeActiveTrip,
  normalizeLiveBusLocation,
  normalizeTripEta,
} from "@/features/passenger/api/passenger.normalizer";
import type { ActiveTrip, LiveBusLocation, TripEta } from "@/types/trip";

function extractData<T>(payload: any): T | null {
  if (!payload) return null;
  if (payload.data !== undefined) return payload.data as T;
  return payload as T;
}

export async function getActiveTrips(): Promise<ActiveTrip[]> {
  const res = await api.get(API_ENDPOINTS.passenger.activeTrips);

  const raw =
    res.data?.trips ?? res.data?.data?.trips ?? extractData<unknown>(res.data);

  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeActiveTrip).filter((trip) => Boolean(trip.tripId));
}

export async function getLiveTripState(
  tripId: string,
): Promise<LiveBusLocation | null> {
  const res = await api.get(API_ENDPOINTS.passenger.liveTripState(tripId));
  return normalizeLiveBusLocation(extractData(res.data));
}

export async function getTripEta(tripId: string): Promise<TripEta | null> {
  try {
    const res = await api.get(API_ENDPOINTS.passenger.tripEta(tripId));
    return normalizeTripEta(extractData(res.data));
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
}
