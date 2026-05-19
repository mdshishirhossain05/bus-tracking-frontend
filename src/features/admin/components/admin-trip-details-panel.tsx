"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCoordinate,
  formatDateTime,
  formatRelativeTime,
  formatSpeed,
} from "@/lib/utils/format";
import type { AdminTripDetail, AdminTripSnapshot } from "@/features/admin/types";

interface AdminTripDetailsPanelProps {
  snapshot?: AdminTripSnapshot | null;
  detail?: AdminTripDetail | null;
  loading?: boolean;
  actionLoading?: "force-end" | "force-recover" | "auto-end" | null;
  onForceEnd: () => void;
  onForceRecover: () => void;
  onToggleAutoEnd: (disabled: boolean) => void;
}

function toneForSourceStatus(status: string | null | undefined) {
  switch (status) {
    case "HEALTHY":
      return "success";
    case "STALE":
      return "warning";
    case "UNHEALTHY":
    case "DISCONNECTED":
      return "danger";
    default:
      return "neutral";
  }
}

function toneForActionState(label: string) {
  if (label.includes("AUTO")) return "info";
  if (label.includes("MANUAL")) return "neutral";
  return "neutral";
}

function sourceLabel(
  type: string | null | undefined,
  fallback: string | null | undefined,
) {
  if (fallback) return fallback;
  if (type === "GPS_DEVICE") return "GPS Device";
  if (type === "DRIVER_MOBILE") return "Driver Mobile";
  return "Unknown Source";
}

function DiagnosticsSourceCard({
  title,
  source,
}: {
  title: string;
  source:
    | AdminTripDetail["sources"]["driverMobile"]
    | AdminTripDetail["sources"]["gpsDevice"]
    | null
    | undefined;
}) {
  if (!source) {
    return (
      <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        <p className="mt-3 text-sm text-slate-500">No source data available.</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        <Badge tone="info">
          {sourceLabel(source.sourceType, source.sourceLabel)}
        </Badge>
        <Badge tone={toneForSourceStatus(source.sourceStatus)}>
          {source.sourceStatus}
        </Badge>
        {source.isSelected ? <Badge tone="success">Selected</Badge> : null}
      </div>

      <div className="grid gap-2 text-sm text-slate-300">
        <p>
          Coordinates: {formatCoordinate(source.latitude)},{" "}
          {formatCoordinate(source.longitude)}
        </p>
        <p>Speed: {formatSpeed(source.displaySpeedKmh ?? source.speedKmh)}</p>
        <p>Health score: {source.healthScore}</p>
        <p>Priority: {source.priorityRank}</p>
        <p>
          Recorded: {source.recordedAt ? formatDateTime(source.recordedAt) : "N/A"}
        </p>
        <p>
          Last seen: {source.lastSeenAt ? formatDateTime(source.lastSeenAt) : "N/A"}
        </p>
      </div>
    </div>
  );
}

export function AdminTripDetailsPanel({
  snapshot,
  detail,
  loading,
  actionLoading,
  onForceEnd,
  onForceRecover,
  onToggleAutoEnd,
}: AdminTripDetailsPanelProps) {
  const [confirmAction, setConfirmAction] = useState<
    "force-end" | "force-recover" | null
  >(null);

  const selectedSource = useMemo(() => {
    return detail?.canonical.selectedSource ?? snapshot?.selectedSource ?? null;
  }, [detail, snapshot]);

  const liveState = useMemo(() => {
    return detail?.canonical.liveState ?? snapshot?.liveState ?? null;
  }, [detail, snapshot]);

  const lastLiveTimestamp = useMemo(() => {
    if (!liveState || typeof liveState !== "object") return null;

    if ("updatedAt" in liveState) {
      return liveState.updatedAt ?? null;
    }

    if ("recordedAt" in liveState) {
      return liveState.recordedAt ?? null;
    }

    return null;
  }, [liveState]);

  const normalizedLatitude = useMemo(() => {
    if (!liveState || typeof liveState !== "object") {
      return snapshot?.liveState?.latitude ?? null;
    }

    if ("latitude" in liveState && liveState.latitude != null) {
      return liveState.latitude;
    }

    if ("lat" in liveState && liveState.lat != null) {
      return liveState.lat;
    }

    return snapshot?.liveState?.latitude ?? null;
  }, [liveState, snapshot]);

  const normalizedLongitude = useMemo(() => {
    if (!liveState || typeof liveState !== "object") {
      return snapshot?.liveState?.longitude ?? null;
    }

    if ("longitude" in liveState && liveState.longitude != null) {
      return liveState.longitude;
    }

    if ("lng" in liveState && liveState.lng != null) {
      return liveState.lng;
    }

    return snapshot?.liveState?.longitude ?? null;
  }, [liveState, snapshot]);

  const normalizedSpeed = useMemo(() => {
    if (!liveState || typeof liveState !== "object") {
      return snapshot?.liveState?.speed ?? snapshot?.liveState?.speedKmh ?? null;
    }

    if ("displaySpeedKmh" in liveState && liveState.displaySpeedKmh != null) {
      return liveState.displaySpeedKmh;
    }

    if ("speedKmh" in liveState && liveState.speedKmh != null) {
      return liveState.speedKmh;
    }

    return snapshot?.liveState?.speed ?? snapshot?.liveState?.speedKmh ?? null;
  }, [liveState, snapshot]);

  const canForceEnd = detail?.actions.canForceEnd ?? false;
  const canForceRecover = detail?.actions.canForceRecover ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Trip Details</CardTitle>
        <CardDescription>
          Route, ETA, freshness, selected source, lifecycle state, and admin override actions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!snapshot ? (
          <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center text-sm text-slate-500">
            No trip selected.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-100">
                  {snapshot.trip.routeName ?? snapshot.trip.routeId}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Trip ID: {snapshot.trip.tripId}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={snapshot.isStale ? "warning" : "success"}>
                  {snapshot.isStale ? "Stale" : "Fresh"}
                </Badge>
                <Badge tone="info">{snapshot.trip.status}</Badge>
                {snapshot.trip.activationMode ? (
                  <Badge tone={toneForActionState(snapshot.trip.activationMode)}>
                    {snapshot.trip.activationMode}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Bus
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {snapshot.trip.busLabel ?? snapshot.trip.busId ?? "N/A"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {snapshot.trip.plateNumber ?? "Plate N/A"}
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Driver
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {detail?.trip.driverName ?? snapshot.trip.driverName ?? "N/A"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {detail?.trip.driverEmail ?? "Driver email unavailable"}
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  ETA
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {detail?.trip.etaMinutes ?? snapshot.eta?.etaMinutes ?? null
                    ? `${detail?.trip.etaMinutes ?? snapshot.eta?.etaMinutes} min`
                    : "N/A"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Next stop: {detail?.trip.nextStopName ?? snapshot.eta?.nextStopName ?? "N/A"}
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Last Location Update
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {lastLiveTimestamp ? formatRelativeTime(lastLiveTimestamp) : "N/A"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {lastLiveTimestamp ? formatDateTime(lastLiveTimestamp) : ""}
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Coordinates
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {formatCoordinate(normalizedLatitude)},{" "}
                  {formatCoordinate(normalizedLongitude)}
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Speed
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {formatSpeed(normalizedSpeed)}
                </p>
              </div>
            </div>

            <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Selected source
                </p>
                <Badge tone="info">
                  {sourceLabel(selectedSource?.sourceType, selectedSource?.sourceLabel)}
                </Badge>
                <Badge tone={toneForSourceStatus(selectedSource?.sourceStatus)}>
                  {selectedSource?.sourceStatus ?? "UNKNOWN"}
                </Badge>
                {selectedSource?.selectionReason ? (
                  <Badge tone="neutral">{selectedSource.selectionReason}</Badge>
                ) : null}
              </div>
              <p className="text-sm text-slate-400">
                Canonical source currently powering the live trip view.
              </p>
            </div>

            <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Admin operational controls
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use these actions only when a trip is stuck, stale, or operationally inconsistent.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConfirmAction((current) =>
                        current === "force-recover" ? null : "force-recover",
                      )
                    }
                    disabled={!canForceRecover || actionLoading !== null}
                  >
                    {actionLoading === "force-recover"
                      ? "Recovering..."
                      : "Force recover"}
                  </Button>

                  <Button
                    onClick={() =>
                      setConfirmAction((current) =>
                        current === "force-end" ? null : "force-end",
                      )
                    }
                    disabled={!canForceEnd || actionLoading !== null}
                  >
                    {actionLoading === "force-end" ? "Ending..." : "Force end"}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() =>
                      onToggleAutoEnd(
                        !(snapshot?.trip.autoEndDisabled ?? false),
                      )
                    }
                    disabled={!canForceEnd || actionLoading !== null}
                  >
                    {actionLoading === "auto-end"
                      ? "Updating..."
                      : snapshot?.trip.autoEndDisabled
                        ? "Enable auto-end"
                        : "Disable auto-end"}
                  </Button>
                </div>
              </div>

              {confirmAction ? (
                <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-semibold text-amber-300">
                    Confirm admin action
                  </p>
                  <p className="mt-2 text-sm text-amber-300">
                    {confirmAction === "force-end"
                      ? "Force-ending will close this trip immediately through the admin override path."
                      : "Force-recovering will clear stale operational state and re-establish admin monitoring consistency for this running trip."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        if (confirmAction === "force-end") {
                          void onForceEnd();
                        } else {
                          void onForceRecover();
                        }
                        setConfirmAction(null);
                      }}
                      disabled={actionLoading !== null}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmAction(null)}
                      disabled={actionLoading !== null}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Source diagnostics
                </p>
                <p className="text-sm text-slate-500">
                  Driver and GPS health, selection, and assignment visibility.
                </p>
              </div>

              {loading ? (
                <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-8 text-center text-sm text-slate-500">
                  Loading trip operations detail...
                </div>
              ) : null}

              {!loading && detail ? (
                <>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <DiagnosticsSourceCard
                      title="Driver Mobile Source"
                      source={detail.sources.driverMobile}
                    />
                    <DiagnosticsSourceCard
                      title="GPS Device Source"
                      source={detail.sources.gpsDevice}
                    />
                  </div>

                  <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Recent trip events
                    </p>

                    {!detail.recentEvents.length ? (
                      <p className="text-sm text-slate-500">
                        No recent trip events available.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {detail.recentEvents.slice(0, 6).map((event) => (
                          <div
                            key={event.id}
                            className="rounded-sm border border-slate-800 bg-slate-900 p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-100">
                                {event.title}
                              </p>
                              <Badge tone="neutral">{event.type}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">
                              {event.description}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {formatDateTime(event.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}