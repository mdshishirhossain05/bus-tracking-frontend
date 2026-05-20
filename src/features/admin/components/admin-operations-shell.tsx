"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Play, RefreshCcw } from "lucide-react";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { ErrorState } from "@/components/states/error-state";
import { EmptyState } from "@/components/states/empty-state";
import { ReconnectBanner } from "@/components/states/reconnect-banner";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapLegend } from "@/components/map/map-legend";
import { useAdminOperations } from "@/features/admin/hooks/use-admin-operations";
import { AdminKpiGrid } from "@/features/admin/components/admin-kpi-grid";
import { AdminTripMonitorList } from "@/features/admin/components/admin-trip-monitor-list";
import { AdminEventFeed } from "@/features/admin/components/admin-event-feed";
import { AdminTripDetailsPanel } from "@/features/admin/components/admin-trip-details-panel";
import { AdminScheduledItemsCard } from "@/features/admin/components/admin-scheduled-items-card";
import { StartTripModal } from "@/features/admin/components/start-trip-modal";

const LiveTripMap = dynamic(() => import("@/components/map/live-trip-map"), {
  ssr: false,
});

export function AdminOperationsShell() {
  const {
    loading,
    refreshing,
    error,
    snapshots,
    selectedTripId,
    setSelectedTripId,
    selectedTrip,
    selectedSnapshot,
    selectedTripDetail,
    detailLoading,
    events,
    socketStatus,
    activeTripsCount,
    staleTripsCount,
    connectedTripsCount,
    gpsSelectedTrips,
    driverSelectedTrips,
    averageEta,
    onlineUsers,
    liveWatchers,
    scheduledItems,
    retry,
    actionLoading,
    actionMessage,
    actionError,
    forceEndSelectedTrip,
    forceRecoverSelectedTrip,
    toggleSelectedTripAutoEnd,
    clearActionState,
  } = useAdminOperations();

  const { data: routePresentation } = useRoutePresentation(selectedTrip?.routeId);

  const [startTripOpen, setStartTripOpen] = useState(false);

  const hasFreshLivePoint = Boolean(
    selectedSnapshot?.liveState?.latitude != null &&
      selectedSnapshot?.liveState?.longitude != null &&
      !selectedSnapshot?.isStale,
  );

  if (loading) {
    return <SectionSkeleton />;
  }

  // Keep the page populated whenever there is *anything* operational to show
  // — either running trips or schedules waiting to start. The fall-through
  // empty state only triggers when both are empty.
  const hasAnythingToShow = snapshots.length > 0 || scheduledItems.length > 0;

  if (error && !hasAnythingToShow) {
    return <ErrorState description={error} onRetry={() => void retry()} />;
  }

  if (!hasAnythingToShow) {
    return (
      <EmptyState
        title="No live admin operations data"
        description="There are no active trips or scheduled departures right now."
        actionLabel="Reload dashboard"
        onAction={() => void retry()}
      />
    );
  }

  const reconnectStatus =
    socketStatus === "connected"
      ? "connected"
      : socketStatus === "reconnecting"
        ? "reconnecting"
        : socketStatus === "connecting"
          ? "connecting"
          : socketStatus === "error"
            ? "error"
            : "disconnected";

  return (
    <div className="space-y-6">
      <ReconnectBanner status={reconnectStatus} onRetry={() => void retry()} />

      {(actionMessage || actionError) && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={`text-sm font-semibold ${
                  actionError ? "text-red-300" : "text-emerald-300"
                }`}
              >
                {actionError ? "Admin action failed" : "Admin action completed"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {actionError ?? actionMessage}
              </p>
            </div>

            <Button variant="secondary" onClick={clearActionState}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {startTripOpen ? (
        <StartTripModal
          onClose={() => setStartTripOpen(false)}
          onStarted={() => void retry()}
        />
      ) : null}

      <PageSection
        title="Fleet overview"
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setStartTripOpen(true)}>
              <Play className="h-4 w-4" />
              Start trip
            </Button>
            <Button variant="secondary" onClick={() => void retry()}>
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh dashboard
            </Button>
          </div>
        }
      >
        <AdminKpiGrid
          activeTripsCount={activeTripsCount}
          staleTripsCount={staleTripsCount}
          connectedTripsCount={connectedTripsCount}
          gpsSelectedTrips={gpsSelectedTrips}
          driverSelectedTrips={driverSelectedTrips}
          averageEta={averageEta}
          onlineUsers={onlineUsers}
          liveWatchers={liveWatchers}
        />
      </PageSection>

      {scheduledItems.length ? (
        <AdminScheduledItemsCard
          items={scheduledItems}
          onStarted={() => void retry()}
        />
      ) : null}

      {!snapshots.length ? null : (
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <AdminTripMonitorList
          snapshots={snapshots}
          selectedTripId={selectedTripId}
          onSelect={setSelectedTripId}
        />

        <div className="space-y-6">
          <PageSection
            title="Operations map"
            description="Focused admin view for the currently selected trip."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={selectedSnapshot?.isStale ? "warning" : "success"}>
                  {selectedSnapshot?.isStale ? "Stale data" : "Fresh data"}
                </Badge>
                <Badge tone="info">{socketStatus}</Badge>
                {selectedSnapshot?.trip.activationMode ? (
                  <Badge tone="neutral">
                    {selectedSnapshot.trip.activationMode}
                  </Badge>
                ) : null}
                {selectedSnapshot?.selectedSource?.sourceLabel ? (
                  <Badge tone="info">
                    Source: {selectedSnapshot.selectedSource.sourceLabel}
                  </Badge>
                ) : null}
                {selectedSnapshot?.selectedSource?.selectionReason ? (
                  <Badge tone="neutral">
                    {selectedSnapshot.selectedSource.selectionReason}
                  </Badge>
                ) : null}
                {selectedSnapshot?.eta?.nextStopName ? (
                  <Badge tone="info">
                    Next stop: {selectedSnapshot.eta.nextStopName}
                  </Badge>
                ) : null}
              </div>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTrip?.routeName ?? selectedTrip?.routeId ?? "Selected Route"}
                </CardTitle>
                <CardDescription>
                  Admin route visibility, smoothed live vehicle position, and stop context.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <MapLegend isLive={hasFreshLivePoint} />

                <LiveTripMap
                  latitude={selectedSnapshot?.liveState?.latitude}
                  longitude={selectedSnapshot?.liveState?.longitude}
                  routeName={selectedTrip?.routeName ?? selectedTrip?.routeId}
                  busLabel={selectedTrip?.busLabel ?? selectedTrip?.busId}
                  updatedAt={selectedSnapshot?.liveState?.updatedAt}
                  speed={
                    selectedSnapshot?.liveState?.speed ??
                    selectedSnapshot?.liveState?.speedKmh
                  }
                  routePresentation={routePresentation}
                  autoFollow={true}
                />
              </CardContent>
            </Card>
          </PageSection>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <AdminTripDetailsPanel
              snapshot={selectedSnapshot}
              detail={selectedTripDetail}
              loading={detailLoading}
              actionLoading={actionLoading}
              onForceEnd={() => void forceEndSelectedTrip()}
              onForceRecover={() => void forceRecoverSelectedTrip()}
              onToggleAutoEnd={(disabled) =>
                void toggleSelectedTripAutoEnd(disabled)
              }
            />
            <AdminEventFeed events={events} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}