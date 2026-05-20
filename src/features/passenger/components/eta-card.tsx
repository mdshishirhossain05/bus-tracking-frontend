import { Clock3, Flag, Gauge, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnimatedSpeed } from "@/lib/hooks/use-animated-speed";
import type { LiveBusLocation, TripEta } from "@/types/trip";

function formatDistanceMeters(value?: number | null) {
  if (value == null) return "N/A";
  if (value >= 1000) return `${(value / 1000).toFixed(2)} km`;
  return `${Math.round(value)} m`;
}

interface EtaCardProps {
  eta?: TripEta | null;
  liveState?: LiveBusLocation | null;
  isStale?: boolean;
  tripEnded?: boolean;
}

export function EtaCard({
  eta,
  liveState,
  isStale = false,
  tripEnded = false,
}: EtaCardProps) {
  const etaToPassengerStop =
    eta?.passengerNearestStop?.estimatedBusArrivalMinutes ?? eta?.etaMinutes;

  const nearestStop =
    eta?.passengerNearestStop?.stopName ?? eta?.nextStopName ?? "N/A";

  const busToStopDistance =
    eta?.passengerNearestStop?.busToStopDistanceMeters ??
    eta?.nextStopDistanceMeters ??
    null;

  // Pick the live observed speed in preference to the ETA's `usedSpeedKmh`,
  // which is sometimes the default constant when sensors haven't reported a
  // real speed yet — that's what made the displayed speed look "false".
  const targetSpeedKmh =
    liveState?.displaySpeedKmh ??
    liveState?.speed ??
    liveState?.filteredSpeedKmh ??
    liveState?.averageSpeedKmh ??
    liveState?.rawSpeedKmh ??
    eta?.rollingAverageSpeedKmh ??
    null;

  const animatedSpeed = useAnimatedSpeed({
    targetSpeedKmh,
    isStationary: liveState?.isStationary === true,
    updatedAt: liveState?.updatedAt ?? null,
  });

  const currentSpeed = animatedSpeed;

  const badgeTone = tripEnded ? "warning" : isStale ? "warning" : "success";
  const badgeText = tripEnded ? "Ended" : isStale ? "Updating" : "Live ETA";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Trip information</CardTitle>
            <CardDescription>
              Simple ETA and distance summary for the selected bus.
            </CardDescription>
          </div>

          <Badge tone={badgeTone}>{badgeText}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock3 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              ETA
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-100">
            {tripEnded
              ? "Ended"
              : etaToPassengerStop != null
                ? `${etaToPassengerStop} min`
                : "N/A"}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Flag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Next Stop
            </span>
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-slate-100">
            {tripEnded ? "Trip ended" : nearestStop}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Distance
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {tripEnded ? "N/A" : formatDistanceMeters(busToStopDistance)}
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Gauge className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-[0.14em]">
              Speed
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-100">
            {tripEnded
              ? "N/A"
              : currentSpeed != null
                ? `${currentSpeed.toFixed(1)} km/h`
                : "N/A"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}