"use client";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPinned,
  Play,
  RefreshCcw,
  Satellite,
  Smartphone,
  Square,
  WifiOff,
} from "lucide-react";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DriverAssignedTripCard } from "@/features/driver/components/driver-assigned-trip-card";
import { DriverLocationStatusCard } from "@/features/driver/components/driver-location-status-card";
import { DriverControlPanel } from "@/features/driver/components/driver-control-panel";
import { useDriverTripControl } from "@/features/driver/hooks/use-driver-trip-control";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";

const LiveTripMap = dynamic(() => import("@/components/map/live-trip-map"), {
  ssr: false,
});

type LiveTone = "success" | "warning" | "danger" | "neutral";

const dotToneClass: Record<LiveTone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  neutral: "bg-slate-400",
};

function LivePulseDot({ tone }: { tone: LiveTone }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {tone === "success" ? (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotToneClass[tone]}`}
        />
      ) : null}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotToneClass[tone]}`}
      />
    </span>
  );
}

function FloatingPill({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: LiveTone;
  className?: string;
  children: React.ReactNode;
}) {
  const toneText: Record<LiveTone, string> = {
    success: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-red-300",
    neutral: "text-slate-100",
  };

  return (
    <div
      className={`pointer-events-none inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold backdrop-blur-md shadow-lg ${toneText[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

function ArrivalToast({
  stopName,
  arrivalTime,
  delayMinutes,
}: {
  stopName: string;
  arrivalTime: string;
  delayMinutes: number;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-2xl backdrop-blur-md animate-[fadeInDown_220ms_ease-out]">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-semibold">Reached {stopName}</span>
        <span className="text-emerald-300/80">
          • {formatRelativeTime(arrivalTime)} • {delayMinutes} min
        </span>
      </div>
    </div>
  );
}

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
}): LiveTone {
  const { started, publishState, permission } = params;

  if (!started) return "neutral";
  if (publishState === "error" || permission === "denied") return "danger";
  if (
    publishState === "watching" ||
    publishState === "sending" ||
    publishState === "recovering"
  ) {
    return "warning";
  }

  return "success";
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
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={clearEndedContext}
                >
                  Dismiss
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full"
                  onClick={() => void refreshTrip()}
                >
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

  const canStart = trip.status === "PLANNED";
  const canEnd = trip.status === "RUNNING";

  return (
    <>
      <div className="space-y-4 pb-24 sm:space-y-5 sm:pb-0">
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
                className="w-full rounded-full sm:w-auto"
                onClick={() => void refreshTrip()}
                disabled={refreshing}
              >
                <RefreshCcw className="h-4 w-4" />
                {refreshing ? "Refreshing…" : "Retry"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Sticky native-style top status bar. */}
        <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-slate-800/60 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-slate-800/70 sm:bg-slate-900/60 sm:px-4">
          <LivePulseDot tone={liveTone} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">
              {trip.routeName}
            </p>
            <p className="truncate text-xs text-slate-400">{liveLabel}</p>
          </div>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => void refreshTrip()}
            disabled={refreshing}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Map first on mobile, side panels first on desktop. */}
          <div className="order-2 space-y-4 xl:order-1">
            <DriverControlPanel
              canStart={canStart}
              canEnd={canEnd}
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

          <div className="order-1 space-y-4 xl:order-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 shadow-xl shadow-slate-950/40">
              <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
                <FloatingPill tone={liveTone}>
                  <LivePulseDot tone={liveTone} />
                  <span>{liveLabel}</span>
                </FloatingPill>

                <div className="flex flex-wrap items-start justify-end gap-2">
                  <FloatingPill tone="neutral">
                    {getSourceIcon(trackingSource?.sourceType)}
                    <span>{trackingLabel}</span>
                  </FloatingPill>
                  {etaMinutes != null ? (
                    <FloatingPill tone="success">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>ETA {etaMinutes} min</span>
                    </FloatingPill>
                  ) : null}
                </div>
              </div>

              {nextStopName ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-4">
                  <FloatingPill tone="neutral">
                    <MapPinned className="h-3.5 w-3.5" />
                    <span className="text-slate-400">Next stop</span>
                    <span className="text-slate-100">{nextStopName}</span>
                  </FloatingPill>
                </div>
              ) : null}

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
            </div>

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
                  Allow browser location access so passengers can see the live
                  bus position.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Native-app-style sticky bottom action bar — mobile-only primary CTA. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md shadow-2xl sm:hidden">
        {canStart ? (
          <Button
            variant="primary"
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold"
            onClick={() => void startTrip()}
            disabled={submittingStart}
          >
            {submittingStart ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {submittingStart ? "Starting…" : "Start Trip"}
          </Button>
        ) : canEnd ? (
          <Button
            variant="danger"
            size="lg"
            className="h-12 w-full rounded-full text-base font-semibold"
            onClick={() => void endTrip()}
            disabled={submittingEnd}
          >
            {submittingEnd ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            {submittingEnd ? "Ending…" : "End Trip"}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <LivePulseDot tone={liveTone} />
            <span>{liveLabel}</span>
          </div>
        )}
      </div>

      {recentArrival ? (
        <ArrivalToast
          stopName={recentArrival.stopName}
          arrivalTime={recentArrival.arrivalTime}
          delayMinutes={recentArrival.delayMinutes}
        />
      ) : null}
    </>
  );
}
