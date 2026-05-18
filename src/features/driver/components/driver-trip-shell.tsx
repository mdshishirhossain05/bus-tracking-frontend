"use client";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPinned,
  RefreshCcw,
  Satellite,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DriverAssignedTripCard } from "@/features/driver/components/driver-assigned-trip-card";
import { DriverLocationStatusCard } from "@/features/driver/components/driver-location-status-card";
import { DriverControlPanel } from "@/features/driver/components/driver-control-panel";
import { useDriverTripControl } from "@/features/driver/hooks/use-driver-trip-control";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";

const LiveTripMap = dynamic(() => import("@/components/map/live-trip-map"), {
  ssr: false,
});

function sourceLabel(
  type: string | null | undefined,
  fallback: string | null | undefined,
) {
  if (fallback) return fallback;
  if (type === "GPS_DEVICE") return "GPS device";
  if (type === "DRIVER_MOBILE") return "Driver phone";
  return "Tracking source";
}

function getEtaMinutes(trip: any): number | null {
  const eta =
    trip?.eta?.etaMinutes ??
    trip?.eta?.eta?.etaMinutes ??
    trip?.eta?.minutes ??
    null;

  return typeof eta === "number" && Number.isFinite(eta) ? eta : null;
}

function getNextStopName(trip: any): string | null {
  const name =
    trip?.eta?.nextStopName ??
    trip?.eta?.eta?.nextStop?.stopName ??
    trip?.eta?.nearestStopName ??
    null;

  return typeof name === "string" && name.trim().length > 0
    ? name.trim()
    : null;
}

function getNextStopId(
  trip: any,
  routePresentation: {
    stops?: Array<{
      id?: string | null;
      name?: string | null;
    }> | null;
  } | null,
): string | null {
  const nextStopName = getNextStopName(trip);

  if (!nextStopName || !routePresentation?.stops?.length) {
    return null;
  }

  const normalized = nextStopName.trim().toLowerCase();

  const matched = routePresentation.stops.find((stop) => {
    return typeof stop?.name === "string"
      ? stop.name.trim().toLowerCase() === normalized
      : false;
  });

  return matched?.id ?? null;
}

function getDriverDisplaySpeed(liveState: any): number | null {
  if (!liveState) return null;
  if (liveState.isStationary === true) return 0;

  const candidates = [
    liveState.displaySpeedKmh,
    liveState.speed,
    liveState.filteredSpeedKmh,
    liveState.averageSpeedKmh,
    liveState.rawSpeedKmh,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getLiveTone(params: {
  started: boolean;
  publishState: string;
  permission: string;
}) {
  const { started, publishState, permission } = params;

  if (!started) return "neutral" as const;
  if (publishState === "error" || permission === "denied") {
    return "danger" as const;
  }
  if (
    publishState === "watching" ||
    publishState === "sending" ||
    publishState === "recovering"
  ) {
    return "warning" as const;
  }

  return "success" as const;
}

function getLiveLabel(params: {
  started: boolean;
  publishState: string;
  permission: string;
}) {
  const { started, publishState, permission } = params;

  if (!started) return "Ready to start";
  if (permission === "denied") return "Location blocked";
  if (publishState === "error") return "GPS attention needed";
  if (publishState === "watching") return "Watching GPS";
  if (publishState === "sending") return "Sending location";
  if (publishState === "recovering") return "Recovering GPS";
  if (publishState === "success") return "Live tracking";
  return "Trip active";
}

function getSourceIcon(sourceType?: string | null) {
  return sourceType === "GPS_DEVICE" ? (
    <Satellite className="h-3.5 w-3.5" />
  ) : (
    <Smartphone className="h-3.5 w-3.5" />
  );
}

export function DriverTripShell() {
  const {
    loading,
    refreshing,
    error,
    trip,
    started,
    permission,
    publishState,
    publishIntervalMs,
    liveState,
    trackingSource,
    recentArrival,
    submittingStart,
    submittingEnd,
    startReadinessStage,
    lastEndedContext,
    clearEndedContext,
    setPublishIntervalMs,
    requestPermission,
    refreshTrip,
    startTrip,
    endTrip,
    sendNow,
  } = useDriverTripControl();

  const { data: routePresentation } = useRoutePresentation(trip?.routeId);

  if (loading && !trip) return <SectionSkeleton />;

  if (!trip) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {lastEndedContext ? (
          <Card
            className={
              lastEndedContext.wasExternal
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-emerald-500/30 bg-emerald-500/10"
            }
          >
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    lastEndedContext.wasExternal
                      ? "text-amber-300"
                      : "text-emerald-300"
                  }`}
                >
                  {lastEndedContext.wasExternal
                    ? "Trip ended outside this console"
                    : "Trip ended successfully"}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {lastEndedContext.reasonLabel}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {lastEndedContext.routeName ??
                    lastEndedContext.routeId ??
                    "Trip"}{" "}
                  •{" "}
                  {lastEndedContext.busLabel ??
                    lastEndedContext.busId ??
                    "Bus"}
                  {lastEndedContext.endedAt
                    ? ` • ${formatDateTime(lastEndedContext.endedAt)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={clearEndedContext}>
                  Dismiss
                </Button>
                <Button variant="secondary" onClick={() => void refreshTrip()}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <EmptyState
          title={lastEndedContext ? "Trip closed" : "No assigned trip"}
          description={
            lastEndedContext
              ? "This trip is no longer active. Refresh when another trip is assigned."
              : "There is no planned or running trip assigned to this driver yet."
          }
          actionLabel="Refresh assignment"
          onAction={() => void refreshTrip()}
        />
      </div>
    );
  }

  const etaMinutes = getEtaMinutes(trip);
  const nextStopName = getNextStopName(trip);
  const nextStopId = getNextStopId(trip, routePresentation);
  const displaySpeed = getDriverDisplaySpeed(liveState);

  const liveTone = getLiveTone({
    started,
    publishState,
    permission,
  });

  const liveLabel = getLiveLabel({
    started,
    publishState,
    permission,
  });

  const trackingLabel = sourceLabel(
    trackingSource?.sourceType,
    trackingSource?.sourceLabel,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  Driver operation issue
                </p>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => void refreshTrip()}
              disabled={refreshing}
            >
              <RefreshCcw className="h-4 w-4" />
              {refreshing ? "Refreshing..." : "Retry"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {recentArrival ? (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Reached {recentArrival.stopName}</p>
              <p className="mt-1">
                {formatRelativeTime(recentArrival.arrivalTime)} • Delay{" "}
                {recentArrival.delayMinutes} min
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
            Driver trip
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Start, monitor, and complete your assigned route.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge tone={liveTone}>{liveLabel}</Badge>
          <Badge tone="info">
            {getSourceIcon(trackingSource?.sourceType)}
            {trackingLabel}
          </Badge>
          {nextStopName ? (
            <Badge tone="neutral">Next: {nextStopName}</Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <DriverControlPanel
            canStart={trip.status === "PLANNED"}
            canEnd={trip.status === "RUNNING"}
            started={started}
            submittingStart={submittingStart}
            submittingEnd={submittingEnd}
            publishState={publishState}
            permission={permission}
            publishIntervalMs={publishIntervalMs}
            startReadinessStage={startReadinessStage}
            trackingSource={trackingSource}
            onChangeInterval={setPublishIntervalMs}
            onRequestPermission={() => void requestPermission()}
            onStartTrip={() => void startTrip()}
            onEndTrip={() => void endTrip()}
            onSendNow={() => void sendNow()}
          />

          <DriverLocationStatusCard
            liveState={liveState}
            permission={permission}
            publishState={publishState}
            trackingSource={trackingSource}
          />
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{trip.routeName}</CardTitle>
                  <CardDescription>
                    Google road route, live bus position, and next stop.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={liveTone}>{liveLabel}</Badge>
                  {etaMinutes != null ? (
                    <Badge tone="info">
                      <Clock3 className="h-3.5 w-3.5" />
                      ETA {etaMinutes} min
                    </Badge>
                  ) : null}
                  {routePresentation ? (
                    <Badge tone="neutral">
                      <MapPinned className="h-3.5 w-3.5" />
                      Route ready
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <LiveTripMap
                latitude={liveState?.latitude}
                longitude={liveState?.longitude}
                routeName={trip.routeName}
                busLabel={trip.busLabel}
                updatedAt={liveState?.updatedAt}
                speed={displaySpeed}
                heading={liveState?.heading ?? null}
                accuracyM={liveState?.accuracyM ?? null}
                isStationary={liveState?.isStationary}
                etaMinutes={etaMinutes}
                nextStopName={nextStopName}
                routePresentation={routePresentation}
                highlightedStopId={nextStopId}
                arrivedStopId={recentArrival?.stopId ?? null}
                autoFollow={true}
              />
            </CardContent>
          </Card>

          <DriverAssignedTripCard
            trip={trip}
            liveState={liveState}
            routePresentation={routePresentation}
            recentArrival={recentArrival}
            nextStopId={nextStopId}
            nextStopName={nextStopName}
            etaMinutes={etaMinutes}
          />
        </div>
      </div>

      {started && permission === "denied" ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-300">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Location permission is blocked.</p>
              <p className="mt-1">
                Allow browser location access so passengers can see the live bus
                position.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}