import { Activity, Gauge, Navigation, RefreshCcw, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCoordinate,
  formatDateTime,
  formatRelativeTime,
  formatSpeed,
} from "@/lib/utils/format";
import type { LiveBusLocation } from "@/types/trip";

interface BusStatusCardProps {
  liveState?: LiveBusLocation | null;
  isStale?: boolean;
  tripEnded?: boolean;
}

export function BusStatusCard({
  liveState,
  isStale = false,
  tripEnded = false,
}: BusStatusCardProps) {
  const tone = tripEnded ? "danger" : isStale ? "warning" : "success";
  const label = tripEnded ? "Ended" : isStale ? "Stale" : "Fresh";

  const currentSpeed =
    liveState?.displaySpeedKmh ??
    liveState?.speed ??
    liveState?.filteredSpeedKmh ??
    null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Vehicle Status</CardTitle>
            <CardDescription>
              Current passenger-facing vehicle position, real-time speed, average speed, and freshness.
            </CardDescription>
          </div>

          <Badge tone={tone}>{label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Latitude
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {formatCoordinate(liveState?.latitude)}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Navigation className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Longitude
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {formatCoordinate(liveState?.longitude)}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Gauge className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Current Speed
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {tripEnded ? "Trip ended" : formatSpeed(currentSpeed)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tripEnded ? "" : "Real-time validated vehicle speed"}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Radar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Avg 3 Min
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {tripEnded
              ? "Trip ended"
              : liveState?.averageSpeedKmh != null
                ? `${liveState.averageSpeedKmh.toFixed(1)} km/h`
                : "N/A"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {tripEnded ? "" : "Display-only rolling average"}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <RefreshCcw className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Last Update
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {liveState?.updatedAt ? formatRelativeTime(liveState.updatedAt) : "N/A"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {liveState?.updatedAt ? formatDateTime(liveState.updatedAt) : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}