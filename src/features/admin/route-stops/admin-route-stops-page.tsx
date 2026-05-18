"use client";

import { useEffect, useMemo, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api/error";
import { messages } from "@/lib/constants/messages";
import { useToast } from "@/providers/toast-provider";
import { AvailableStopsPanel } from "./components/available-stops-panel";
import { AssignedStopsPanel } from "./components/assigned-stops-panel";
import { RouteSelectorCard } from "./components/route-selector-card";
import { RouteStopsMapPanel } from "./components/route-stops-map-panel";
import { useAdminRouteStops } from "./hooks/use-admin-route-stops";

function formatDistanceKm(value: number | null) {
  if (value == null) return "After save";
  return `${value.toFixed(2)} km`;
}

function formatDurationMinutes(value: number | null) {
  if (value == null) return "After save";

  if (value < 60) {
    return `${Math.round(value)} min`;
  }

  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function AdminRouteStopsPage() {
  const toast = useToast();
  const {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    selectedRoute,
    assignedStops,
    unassignedStops,
    routeGeometry,
    routeSummary,
    loadingBoot,
    loadingRouteStops,
    hasUnsavedChanges,
    validationIssues,
    isRouteReadyToSave,
    changeSummary,
    reloadBoot,
    addStop,
    removeStop,
    reorderStop,
    moveStopUp,
    moveStopDown,
    discardChanges,
    save,
  } = useAdminRouteStops();

  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [selectedRouteId]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const lastAssignedDistanceKm = useMemo(() => {
    const distances = assignedStops
      .map((stop) => stop.distanceFromStartKm)
      .filter((value): value is number => value != null && Number.isFinite(value));

    if (!distances.length) return null;

    return Math.max(...distances);
  }, [assignedStops]);

  async function handleRefresh() {
    try {
      setLoadFailed(false);
      await reloadBoot();
      toast.success(
        "Route data refreshed",
        "Latest routes and stops were loaded successfully.",
      );
    } catch (error) {
      setLoadFailed(true);
      toast.danger("Refresh failed", getApiErrorMessage(error));
    }
  }

  async function handleSave() {
    if (!selectedRouteId) {
      toast.warning("Select a route", "Choose a route before saving route stops.");
      return;
    }

    if (!isRouteReadyToSave) {
      toast.warning(
        "Route is not ready",
        validationIssues[0] ??
          "Fix the route stop validation issues before saving.",
      );
      return;
    }

    try {
      setSaving(true);
      const result = await save();

      toast.success(
        "Route stops saved",
        result.message ??
          "Route stops were saved successfully and distances were recalculated.",
      );
    } catch (error) {
      toast.danger(
        "Save failed",
        getApiErrorMessage(
          error,
          "Unable to save route stops. Please review the route and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleAddStop(stop: Parameters<typeof addStop>[0]) {
    const added = addStop(stop);

    if (!added) {
      toast.warning(
        "Stop already assigned",
        `${stop.stopName} is already part of this route.`,
      );
      return;
    }

    toast.success(
      "Stop added",
      `${stop.stopName} was added to the current route sequence.`,
    );
  }

  function handleDiscard() {
    discardChanges();
    toast.info("Changes discarded", "Unsaved route stop changes were reverted.");
  }

  if (loadingBoot) {
    return <SectionSkeleton />;
  }

  if (loadFailed) {
    return (
      <ErrorState
        description={messages.error.load("Route stops").description}
        onRetry={() => void handleRefresh()}
      />
    );
  }

  if (routes.length === 0) {
    return (
      <EmptyState
        title="No routes available"
        description="Create at least one route before assigning stops to route sequences."
      />
    );
  }

  return (
    <PageSection
      title="Route Stops Assignment"
      description="Assign, order, and maintain the physical stop sequence for each route."
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="secondary" onClick={() => void handleRefresh()}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={handleDiscard}
            disabled={!hasUnsavedChanges || saving}
          >
            Discard changes
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={
              saving ||
              loadingRouteStops ||
              !hasUnsavedChanges ||
              !isRouteReadyToSave
            }
          >
            {saving ? "Saving..." : "Save route stops"}
          </Button>
        </div>
      }
    >
      <RouteSelectorCard
        routes={routes}
        selectedRouteId={selectedRouteId}
        onChange={(routeId) => {
          if (hasUnsavedChanges) {
            const confirmed = window.confirm(
              "You have unsaved changes. Switching routes will discard them. Continue?",
            );
            if (!confirmed) return;
          }
          setSelectedRouteId(routeId);
        }}
      />

      {!selectedRouteId ? (
        <EmptyState
          title="Select a route"
          description="Choose a route to start assigning and ordering its stops."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Selected route</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">
                  {selectedRoute?.routeName ?? "—"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Assigned stops</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">
                  {assignedStops.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Road distance</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">
                  {formatDistanceKm(
                    routeSummary.distanceKm ?? lastAssignedDistanceKm,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Estimated travel time</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">
                  {formatDurationMinutes(routeSummary.durationMinutes)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-800 bg-slate-950/70">
            <CardContent className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-100">
                  Route operational notes
                </p>
                <p className="text-sm text-slate-400">
                  After you save, the system recalculates cumulative distance
                  and displays saved road-following route geometry when the
                  backend provides it.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={isRouteReadyToSave ? "success" : "warning"}>
                  {isRouteReadyToSave ? "Ready to save" : "Not ready"}
                </Badge>
                <Badge tone={routeSummary.source === "GOOGLE_ROUTES" ? "success" : "neutral"}>
                  {routeSummary.source === "GOOGLE_ROUTES"
                    ? "Google Routes"
                    : routeSummary.source === "SAVED_GEOMETRY"
                      ? "Saved geometry"
                      : hasUnsavedChanges
                        ? "Pending recalculation"
                        : "Geometry pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {(changeSummary.added > 0 ||
            changeSummary.removed > 0 ||
            changeSummary.reordered > 0) && (
            <Card className="border-slate-800 bg-slate-950/70">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold text-slate-100">
                  Pending change summary
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
                  <Badge tone="info">Added: {changeSummary.added}</Badge>
                  <Badge tone="warning">Removed: {changeSummary.removed}</Badge>
                  <Badge tone="neutral">Reordered: {changeSummary.reordered}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {validationIssues.length > 0 ? (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="p-4 sm:p-5">
                <p className="text-sm font-semibold text-amber-300">
                  Fix these issues before saving
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-300">
                  {validationIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <RouteStopsMapPanel
            assignedStops={assignedStops}
            unassignedStops={unassignedStops}
            geometry={routeGeometry}
          />

          <div className="grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
            <AvailableStopsPanel
              stops={unassignedStops}
              onAdd={handleAddStop}
            />

            <AssignedStopsPanel
              routeName={selectedRoute?.routeName}
              stops={assignedStops}
              onMoveUp={moveStopUp}
              onMoveDown={moveStopDown}
              onRemove={removeStop}
              onReorder={reorderStop}
            />
          </div>
        </>
      )}
    </PageSection>
  );
}