import {
  Compass,
  Gauge,
  LocateFixed,
  RefreshCcw,
  Satellite,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { formatRelativeTime, formatSpeed } from "@/lib/utils/format";
import type {
  DriverTrackingSourceSummary,
  LocationPermissionState,
  PublishState,
} from "@/features/driver/types";
import type { LiveBusLocation } from "@/types/trip";

interface DriverLocationStatusCardProps {
  liveState?: LiveBusLocation | null;
  permission: LocationPermissionState;
  publishState: PublishState;
  trackingSource: DriverTrackingSourceSummary | null;
}

function sourceLabel(source: DriverTrackingSourceSummary | null) {
  if (source?.sourceLabel) return source.sourceLabel;
  if (source?.sourceType === "GPS_DEVICE") return "GPS device";
  if (source?.sourceType === "DRIVER_MOBILE") return "Driver phone";
  return "Tracking source";
}

function headingToDirection(heading?: number | null) {
  if (typeof heading !== "number" || Number.isNaN(heading)) return "N/A";

  const normalized = ((heading % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return "North";
  if (normalized >= 22.5 && normalized < 67.5) return "North-East";
  if (normalized >= 67.5 && normalized < 112.5) return "East";
  if (normalized >= 112.5 && normalized < 157.5) return "South-East";
  if (normalized >= 157.5 && normalized < 202.5) return "South";
  if (normalized >= 202.5 && normalized < 247.5) return "South-West";
  if (normalized >= 247.5 && normalized < 292.5) return "West";
  return "North-West";
}

function getDisplaySpeed(liveState?: LiveBusLocation | null) {
  if (!liveState) return null;
  if (liveState.isStationary === true) return 0;

  return (
    liveState.displaySpeedKmh ??
    liveState.speed ??
    liveState.filteredSpeedKmh ??
    liveState.averageSpeedKmh ??
    liveState.rawSpeedKmh ??
    null
  );
}

function getCardTone(
  publishState: PublishState,
  permission: LocationPermissionState,
) {
  if (permission === "denied" || publishState === "error") {
    return "danger" as const;
  }

  if (
    publishState === "watching" ||
    publishState === "sending" ||
    publishState === "recovering"
  ) {
    return "warning" as const;
  }

  if (publishState === "success") {
    return "success" as const;
  }

  return "neutral" as const;
}

function getCardLabel(
  publishState: PublishState,
  permission: LocationPermissionState,
) {
  if (permission === "denied") return "Blocked";
  if (publishState === "error") return "Attention";
  if (publishState === "watching") return "Watching";
  if (publishState === "sending") return "Sending";
  if (publishState === "recovering") return "Recovering";
  if (publishState === "success") return "Live";
  return "Idle";
}

export function DriverLocationStatusCard({
  liveState,
  permission,
  publishState,
  trackingSource,
}: DriverLocationStatusCardProps) {
  const tone = getCardTone(publishState, permission);
  const label = getCardLabel(publishState, permission);
  const isGpsSelected = trackingSource?.sourceType === "GPS_DEVICE";
  const displaySpeed = getDisplaySpeed(liveState);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Live status</CardTitle>
            <CardDescription>
              How your location is being shared right now.
            </CardDescription>
          </div>

          <Badge tone={tone}>{label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <StatTile
          tone="blue"
          icon={
            isGpsSelected ? (
              <Satellite className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )
          }
          label="Source"
          value={sourceLabel(trackingSource)}
        />

        <StatTile
          tone={permission === "denied" ? "amber" : "emerald"}
          icon={<LocateFixed className="h-4 w-4" />}
          label="GPS access"
          value={<span className="capitalize">{permission}</span>}
        />

        <StatTile
          tone="emerald"
          icon={<Gauge className="h-4 w-4" />}
          label="Speed"
          value={formatSpeed(displaySpeed)}
        />

        <StatTile
          tone="violet"
          icon={<Compass className="h-4 w-4" />}
          label="Direction"
          value={headingToDirection(liveState?.heading)}
        />

        <StatTile
          className="sm:col-span-2 xl:col-span-1 2xl:col-span-2"
          tone="slate"
          icon={<RefreshCcw className="h-4 w-4" />}
          label="Last update"
          value={
            liveState?.updatedAt
              ? formatRelativeTime(liveState.updatedAt)
              : "No live update yet"
          }
          hint={
            liveState?.accuracyM != null
              ? `Accuracy: ${Math.round(liveState.accuracyM)} m`
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
