import { api, unwrap } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  OccupancyAggregate,
  OccupancyLevel,
  ServiceAlert,
  VisitRecord,
  VisitStats,
} from "../../types";

export async function startRouteVisit(input: {
  routeId: string;
  tripId?: string | null;
}): Promise<string | null> {
  const res = await api.post(API_ENDPOINTS.passenger.visits, input);
  const data = unwrap<{ visitId: string }>(res.data);
  return data?.visitId ?? null;
}

export async function endRouteVisit(visitId: string): Promise<void> {
  await api.post(API_ENDPOINTS.passenger.endVisit(visitId));
}

export async function listVisitHistory(): Promise<VisitRecord[]> {
  const res = await api.get(API_ENDPOINTS.passenger.visits);
  const data = unwrap<{ items: VisitRecord[] }>(res.data);
  return data?.items ?? [];
}

export async function getVisitStats(): Promise<VisitStats> {
  const res = await api.get(API_ENDPOINTS.passenger.stats);
  const data = unwrap<VisitStats>(res.data);
  return (
    data ?? {
      visitCount30Days: 0,
      uniqueRoutes30Days: 0,
      totalMinutesTracked: 0,
      longestStreakDays: 0,
      topRoutes: [],
    }
  );
}

export async function voteOccupancy(
  tripId: string,
  level: OccupancyLevel,
): Promise<OccupancyAggregate> {
  const res = await api.post(API_ENDPOINTS.passenger.occupancyVote(tripId), {
    level,
  });
  const data = unwrap<OccupancyAggregate>(res.data);
  if (!data) {
    throw new Error("Occupancy vote returned an empty payload");
  }
  return data;
}

export async function getOccupancy(
  tripId: string,
): Promise<OccupancyAggregate> {
  const res = await api.get(API_ENDPOINTS.passenger.occupancy(tripId));
  const data = unwrap<OccupancyAggregate>(res.data);
  return (
    data ?? {
      tripId,
      level: null,
      voteCount: 0,
      counts: { LIGHT: 0, MODERATE: 0, FULL: 0 },
      myVote: null,
    }
  );
}

export async function listActiveAlerts(
  routeId?: string,
): Promise<ServiceAlert[]> {
  const res = await api.get(API_ENDPOINTS.passenger.alerts, {
    params: routeId ? { routeId } : undefined,
  });
  const data = unwrap<{ items: ServiceAlert[] }>(res.data);
  return data?.items ?? [];
}
