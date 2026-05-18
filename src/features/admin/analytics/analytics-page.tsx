"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CalendarDays, Clock3, Route as RouteIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { getAnalyticsOverview, type AnalyticsOverview } from "./api/analytics.api";

function formatDay(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setData(await getAnalyticsOverview());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <SectionSkeleton />;
  }

  if (error || !data) {
    return (
      <ErrorState
        description="Failed to load analytics. Please try again."
        onRetry={() => void load()}
      />
    );
  }

  const { trips, arrivals, topRoutes, dailyTrips } = data;
  const maxDaily = Math.max(1, ...dailyTrips.map((day) => day.count));
  const maxRouteTrips = Math.max(1, ...topRoutes.map((route) => route.tripCount));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Trips"
          value={trips.total}
          helper={`${trips.running} running · ${trips.ended} ended`}
          tone="info"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Trips (last 7 days)"
          value={trips.createdLast7Days}
          helper={`${trips.createdLast30Days} in the last 30 days`}
          tone="success"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="On-Time Rate"
          value={`${arrivals.onTimePercentage}%`}
          helper={`${arrivals.onTime} on-time · ${arrivals.late} late`}
          tone={arrivals.onTimePercentage >= 80 ? "success" : "warning"}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Recorded Arrivals"
          value={arrivals.total}
          helper="Total stop arrivals logged"
          tone="neutral"
          icon={<RouteIcon className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trips per day — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyTrips.length === 0 ? (
            <p className="text-sm text-slate-500">No trip data available.</p>
          ) : (
            <div className="flex h-48 items-end gap-1.5">
              {dailyTrips.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-2"
                  title={`${day.date}: ${day.count} trips`}
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-sm bg-blue-600 transition-all"
                      style={{
                        height: `${Math.max(2, (day.count / maxDaily) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formatDay(day.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Busiest routes by trip count</CardTitle>
        </CardHeader>
        <CardContent>
          {topRoutes.length === 0 ? (
            <EmptyState
              title="No route activity"
              description="No trips have been recorded against any route yet."
            />
          ) : (
            <div className="space-y-3">
              {topRoutes.map((route) => (
                <div key={route.routeId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{route.routeName}</span>
                    <span className="text-slate-400">
                      {route.tripCount} trips
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-sm bg-slate-800">
                    <div
                      className="h-full rounded-sm bg-blue-600"
                      style={{
                        width: `${(route.tripCount / maxRouteTrips) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
