"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LocateFixed,
  RefreshCcw,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReconnectBanner } from "@/components/states/reconnect-banner";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { TripSelectorPanel } from "@/features/passenger/components/trip-selector-panel";
import { EtaCard } from "@/features/passenger/components/eta-card";
import { LiveTripDetails } from "@/features/passenger/components/live-trip-details";
import { usePassengerLiveTrip } from "@/features/passenger/hooks/use-passenger-live-trip";
import { useFavoriteRoutes } from "@/features/passenger/hooks/use-favorite-routes";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";
import { formatRelativeTime } from "@/lib/utils/format";

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

/**
 * Pulsing status dot — gives the page a continuous "this is live" heartbeat
 * instead of a static badge that looks like a page rendered once and stopped.
 */
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

/**
 * Floating glass pill rendered as an overlay on the live map. Designed to
 * look the way a native maps app presents status — readable on any tile
 * background, with backdrop blur and a thin border.
 */
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

/**
 * Top-center slide-in toast for recent stop arrivals — replaces the previous
 * inline arrival banner. Auto-clears via the hook's visibility timer.
 */
function ArrivalToast({
  stopName,
  arrivalTime,
}: {
  stopName: string;
  arrivalTime: string;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-2xl backdrop-blur-md animate-[fadeInDown_220ms_ease-out]">
        <CheckCircle2 className="h-4 w-4" />
        <span className="font-semibold">Reached {stopName}</span>
        <span className="text-emerald-300/80">
          • {formatRelativeTime(arrivalTime)}
        </span>
      </div>
    </div>
  );
}

function PassengerLiveContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tripFromUrl = searchParams.get("trip");

  const [autoFollow, setAutoFollow] = useState(true);

  const {
    loading,
    refreshing,
    error,
    trips,
    selectedTripId,
    selectedTrip,
    liveState,
    eta,
    recentArrival,
    connectionStatus,
    isStale,
    tripEnded,
    passengerLocation,
    retry,
    selectTrip,
    decorateEtaWithPassengerContext,
  } = usePassengerLiveTrip(tripFromUrl);

  const { data: routePresentation } = useRoutePresentation(selectedTrip?.routeId);

  const { favoriteRouteIds, toggleFavorite } = useFavoriteRoutes();

  useEffect(() => {
    if (!selectedTripId || tripFromUrl === selectedTripId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("trip", selectedTripId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, selectedTripId, tripFromUrl]);

  useEffect(() => {
    decorateEtaWithPassengerContext(routePresentation ?? null);
  }, [
    decorateEtaWithPassengerContext,
    routePresentation,
    liveState,
    passengerLocation,
  ]);

  const highlightedStopId = useMemo(
    () => eta?.passengerNearestStop?.stopId ?? null,
    [eta?.passengerNearestStop?.stopId],
  );

  const displaySpeed =
    liveState?.displaySpeedKmh ??
    liveState?.speed ??
    liveState?.filteredSpeedKmh ??
    liveState?.averageSpeedKmh ??
    liveState?.rawSpeedKmh ??
    null;

  const etaMinutes =
    eta?.passengerNearestStop?.estimatedBusArrivalMinutes ??
    eta?.etaMinutes ??
    null;

  const nextStopName =
    eta?.passengerNearestStop?.stopName ?? eta?.nextStopName ?? null;

  if (loading) return <SectionSkeleton />;

  // Only fall back to the full error screen when there is nothing to show.
  // A refresh failure with a live trip already on screen is surfaced inline.
  if (error && !trips.length) {
    return <ErrorState description={error} onRetry={() => void retry()} />;
  }

  if (!trips.length) {
    return (
      <EmptyState
        title="No active trips"
        description="No bus is currently running. When a driver starts a trip, it will appear here."
        actionLabel="Refresh"
        onAction={() => void retry()}
      />
    );
  }

  const liveTone: LiveTone =
    tripEnded || connectionStatus === "disconnected"
      ? "danger"
      : isStale
        ? "warning"
        : connectionStatus === "connected"
          ? "success"
          : "warning";

  const liveLabel = tripEnded
    ? "Trip ended"
    : isStale
      ? "Waiting for fresh update"
      : connectionStatus === "connected"
        ? "Live tracking"
        : "Connecting…";

  return (
    <div className="space-y-4 sm:space-y-5">
      <ReconnectBanner status={connectionStatus} onRetry={() => void retry()} />

      {error ? (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  Live tracking refresh failed
                </p>
                <p className="mt-1 text-sm text-red-300">{error}</p>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full rounded-full sm:w-auto"
              onClick={() => void retry()}
              disabled={refreshing}
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing…" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Sticky native-style top status bar with pulsing live dot. */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-3 border-b border-slate-800/60 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md sm:static sm:mx-0 sm:rounded-2xl sm:border sm:border-slate-800/70 sm:bg-slate-900/60 sm:px-4">
        <LivePulseDot tone={liveTone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">
            {selectedTrip?.routeName ?? "Live tracking"}
          </p>
          <p className="truncate text-xs text-slate-400">{liveLabel}</p>
        </div>

        <Button
          variant={autoFollow ? "primary" : "secondary"}
          size="icon"
          className="rounded-full"
          onClick={() => setAutoFollow((prev) => !prev)}
          aria-label={autoFollow ? "Following bus" : "Follow bus"}
          title={autoFollow ? "Following bus" : "Follow bus"}
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full"
          onClick={() => void retry()}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCcw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar after the map on mobile, beside it on desktop. */}
        <div className="order-2 xl:order-1">
          <TripSelectorPanel
            trips={trips}
            selectedTripId={selectedTripId}
            liveState={liveState}
            onSelect={(tripId) => void selectTrip(tripId)}
            favoriteRouteIds={favoriteRouteIds}
            onToggleFavorite={(routeId) => void toggleFavorite(routeId)}
          />
        </div>

        <div className="order-1 space-y-4 xl:order-2">
          {/* Map with floating native-style overlays. */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 shadow-xl shadow-slate-950/40">
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
              <FloatingPill tone={liveTone}>
                <LivePulseDot tone={liveTone} />
                <span>{liveLabel}</span>
              </FloatingPill>

              {etaMinutes != null ? (
                <FloatingPill tone="success">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>ETA {etaMinutes} min</span>
                </FloatingPill>
              ) : null}
            </div>

            {nextStopName ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-4">
                <FloatingPill tone="neutral">
                  <span className="text-slate-400">Next stop</span>
                  <span className="text-slate-100">{nextStopName}</span>
                </FloatingPill>
              </div>
            ) : null}

            {tripEnded ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-amber-400/30 bg-slate-950/85 px-6 py-5 text-center shadow-2xl backdrop-blur">
                  <WifiOff className="h-6 w-6 text-amber-300" />
                  <p className="text-sm font-semibold text-amber-200">
                    This trip has ended
                  </p>
                  <p className="text-xs text-slate-400">
                    Pick another active trip or refresh the list.
                  </p>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => void retry()}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh trips
                  </Button>
                </div>
              </div>
            ) : null}

            <LiveTripMap
              latitude={liveState?.latitude}
              longitude={liveState?.longitude}
              routeName={selectedTrip?.routeName ?? selectedTrip?.routeId}
              busLabel={selectedTrip?.busLabel ?? selectedTrip?.busId}
              updatedAt={liveState?.updatedAt}
              speed={displaySpeed}
              heading={liveState?.heading}
              accuracyM={liveState?.accuracyM ?? null}
              isStationary={liveState?.isStationary}
              etaMinutes={etaMinutes}
              nextStopName={nextStopName}
              routePresentation={routePresentation}
              passengerLocation={passengerLocation}
              highlightedStopId={highlightedStopId}
              arrivedStopId={recentArrival?.stopId ?? null}
              autoFollow={autoFollow}
            />
          </div>

          <EtaCard
            eta={eta}
            liveState={liveState}
            isStale={isStale}
            tripEnded={tripEnded}
          />

          <LiveTripDetails
            trip={selectedTrip}
            eta={eta}
            passengerLocation={passengerLocation}
            recentArrival={recentArrival}
          />
        </div>
      </div>

      {recentArrival ? (
        <ArrivalToast
          stopName={recentArrival.stopName}
          arrivalTime={recentArrival.arrivalTime}
        />
      ) : null}
    </div>
  );
}

export function PassengerLiveShell() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <PassengerLiveContent />
    </Suspense>
  );
}
