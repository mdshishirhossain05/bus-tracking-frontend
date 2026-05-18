"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocateFixed, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ReconnectBanner } from "@/components/states/reconnect-banner";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { TripSelectorPanel } from "@/features/passenger/components/trip-selector-panel";
import { EtaCard } from "@/features/passenger/components/eta-card";
import { LiveTripDetails } from "@/features/passenger/components/live-trip-details";
import { usePassengerLiveTrip } from "@/features/passenger/hooks/use-passenger-live-trip";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";

const LiveTripMap = dynamic(() => import("@/components/map/live-trip-map"), {
  ssr: false,
});

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

  if (error) {
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

  const mapTitle =
    selectedTrip?.routeName ?? selectedTrip?.routeId ?? "Selected route";

  const liveBadgeTone =
    tripEnded || connectionStatus === "disconnected" || isStale
      ? "warning"
      : "success";

  const liveBadgeText = tripEnded
    ? "Trip ended"
    : isStale
      ? "Waiting for fresh update"
      : connectionStatus === "connected"
        ? "Live"
        : "Connecting";

  return (
    <div className="space-y-4 sm:space-y-6">
      <ReconnectBanner status={connectionStatus} onRetry={() => void retry()} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100 sm:text-2xl">
            Where is my bus?
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track the selected bus on its Google road route in real time.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setAutoFollow((prev) => !prev)}
          >
            <LocateFixed className="h-4 w-4" />
            {autoFollow ? "Following bus" : "Follow bus"}
          </Button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => void retry()}
          >
            <RefreshCcw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {tripEnded ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-300">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">This trip has ended.</p>
              <p className="mt-1">
                Refresh the trip list or select another active trip.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <TripSelectorPanel
          trips={trips}
          selectedTripId={selectedTripId}
          liveState={liveState}
          onSelect={(tripId) => void selectTrip(tripId)}
        />

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{mapTitle}</CardTitle>
                  <CardDescription>
                    Road route, live bus position, your location, and next stop.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={liveBadgeTone}>{liveBadgeText}</Badge>
                  {nextStopName ? (
                    <Badge tone="info">Next: {nextStopName}</Badge>
                  ) : null}
                  {recentArrival ? (
                    <Badge tone="success">
                      Reached: {recentArrival.stopName}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
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
            </CardContent>
          </Card>

          <EtaCard eta={eta} isStale={isStale} tripEnded={tripEnded} />

          <LiveTripDetails
            trip={selectedTrip}
            eta={eta}
            passengerLocation={passengerLocation}
            recentArrival={recentArrival}
          />
        </div>
      </div>
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