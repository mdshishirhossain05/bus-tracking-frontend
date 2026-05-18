import { BusFront, Clock3, MapPinned, Wifi, ArrowRightCircle } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { ConnectionStatus } from "@/lib/utils/status";
import { getConnectionTone } from "@/lib/utils/status";
import type { ActiveTrip, TripEta } from "@/types/trip";

interface LiveTripSummaryProps {
  selectedTrip?: ActiveTrip | null;
  eta?: TripEta | null;
  connectionStatus: ConnectionStatus;
  isStale?: boolean;
  tripEnded?: boolean;
}

export function LiveTripSummary({
  selectedTrip,
  eta,
  connectionStatus,
  isStale = false,
  tripEnded = false,
}: LiveTripSummaryProps) {
  const etaValue = tripEnded
    ? "Ended"
    : eta?.passengerNearestStop?.estimatedBusArrivalMinutes != null
      ? `${eta.passengerNearestStop.estimatedBusArrivalMinutes} min`
      : eta?.etaMinutes != null
        ? `${eta.etaMinutes} min`
        : isStale
          ? "Refreshing"
          : "N/A";

  const etaHelper = tripEnded
    ? "Selected trip is no longer active"
    : eta?.passengerNearestStop?.stopName
      ? `Bus to your nearest stop: ${eta.passengerNearestStop.stopName}`
      : eta?.nextStopName
        ? `Next stop: ${eta.nextStopName}`
        : isStale
          ? "Waiting for fresh ETA data"
          : "ETA unavailable";

  const realtimeHelper = tripEnded
    ? "Trip closed"
    : isStale
      ? "Last known live packet is stale"
      : "Socket stream healthy";

  const progressValue = tripEnded
    ? "Completed"
    : eta?.nextStopName ?? eta?.nearestStopName ?? "N/A";

  const progressHelper = tripEnded
    ? "Trip is no longer progressing"
    : eta?.nearestStopName && eta?.nextStopName
      ? `Current context: ${eta.nearestStopName} • Next: ${eta.nextStopName}`
      : eta?.nearestStopName
        ? `Current context: ${eta.nearestStopName}`
        : "Stop progression unavailable";

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Selected Route"
        value={selectedTrip?.routeName ?? selectedTrip?.routeId ?? "N/A"}
        helper="Current passenger tracking context"
        icon={<MapPinned className="h-5 w-5" />}
      />

      <StatCard
        label="ETA To Your Stop"
        value={etaValue}
        helper={etaHelper}
        tone={tripEnded ? "warning" : etaValue !== "N/A" ? "info" : "neutral"}
        icon={<Clock3 className="h-5 w-5" />}
      />

      <StatCard
        label="Vehicle"
        value={selectedTrip?.busLabel ?? selectedTrip?.busId ?? "N/A"}
        helper={
          selectedTrip?.status
            ? `Status: ${selectedTrip.status}`
            : "No vehicle selected"
        }
        icon={<BusFront className="h-5 w-5" />}
      />

      <StatCard
        label="Stop Progress"
        value={progressValue}
        helper={progressHelper}
        tone={tripEnded ? "warning" : progressValue !== "N/A" ? "info" : "neutral"}
        icon={<ArrowRightCircle className="h-5 w-5" />}
      />

      <StatCard
        label="Realtime Connection"
        value={tripEnded ? "ended" : connectionStatus}
        helper={realtimeHelper}
        tone={tripEnded ? "warning" : getConnectionTone(connectionStatus)}
        trendLabel={
          tripEnded
            ? "Closed"
            : connectionStatus === "connected" && !isStale
              ? "Live"
              : "Attention"
        }
        icon={<Wifi className="h-5 w-5" />}
      />
    </div>
  );
}