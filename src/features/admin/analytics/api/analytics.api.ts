import { api } from "@/lib/api/axios";

export interface AnalyticsOverview {
  trips: {
    total: number;
    running: number;
    planned: number;
    ended: number;
    createdLast7Days: number;
    createdLast30Days: number;
  };
  arrivals: {
    total: number;
    onTime: number;
    late: number;
    onTimePercentage: number;
  };
  topRoutes: Array<{
    routeId: string;
    routeName: string;
    tripCount: number;
  }>;
  dailyTrips: Array<{
    date: string;
    count: number;
  }>;
}

const EMPTY_OVERVIEW: AnalyticsOverview = {
  trips: {
    total: 0,
    running: 0,
    planned: 0,
    ended: 0,
    createdLast7Days: 0,
    createdLast30Days: 0,
  },
  arrivals: { total: 0, onTime: 0, late: 0, onTimePercentage: 0 },
  topRoutes: [],
  dailyTrips: [],
};

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await api.get("/admin/analytics/overview");
  const data = res.data?.data ?? res.data ?? {};

  return {
    trips: { ...EMPTY_OVERVIEW.trips, ...(data.trips ?? {}) },
    arrivals: { ...EMPTY_OVERVIEW.arrivals, ...(data.arrivals ?? {}) },
    topRoutes: Array.isArray(data.topRoutes) ? data.topRoutes : [],
    dailyTrips: Array.isArray(data.dailyTrips) ? data.dailyTrips : [],
  };
}
