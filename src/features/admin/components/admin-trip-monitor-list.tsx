"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AdminTripSnapshot } from "@/features/admin/types";

interface AdminTripMonitorListProps {
  snapshots: AdminTripSnapshot[];
  selectedTripId?: string;
  onSelect: (tripId: string) => void;
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

function sourceLabel(
  type: string | null | undefined,
  fallback: string | null | undefined,
) {
  if (fallback) return fallback;
  if (type === "GPS_DEVICE") return "GPS Device";
  if (type === "DRIVER_MOBILE") return "Driver Mobile";
  return "Unknown Source";
}

function sourceStatusText(status: string | null | undefined) {
  switch (status) {
    case "HEALTHY":
      return "Healthy";
    case "STALE":
      return "Stale";
    case "UNHEALTHY":
      return "Unhealthy";
    case "DISCONNECTED":
      return "Disconnected";
    default:
      return "Unknown";
  }
}

function shortTripRef(tripId: string) {
  return `#${tripId.slice(-6).toUpperCase()}`;
}

export function AdminTripMonitorList({
  snapshots,
  selectedTripId,
  onSelect,
}: AdminTripMonitorListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return snapshots.filter((item) => {
      const status = item.trip.status.toLowerCase();

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "stale"
            ? item.isStale
            : statusFilter === "active"
              ? status === "running"
              : status === statusFilter.toLowerCase();

      const haystack = [
        item.trip.tripId,
        item.trip.routeId,
        item.trip.routeName ?? "",
        item.trip.busLabel ?? "",
        item.trip.driverName ?? "",
        item.trip.activationMode ?? "",
        item.trip.startedByGpsDeviceId ?? "",
        item.selectedSource?.sourceType ?? "",
        item.selectedSource?.sourceLabel ?? "",
        item.selectedSource?.selectionReason ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = q ? haystack.includes(q) : true;

      return matchesStatus && matchesSearch;
    });
  }, [search, snapshots, statusFilter]);

  return (
    <Card className="min-h-[760px]">
      <CardHeader>
        <CardTitle>Trip monitor</CardTitle>
        <CardDescription>
          Search and inspect active trips across the fleet.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search route, trip, bus, driver, source..."
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active (Running)</option>
            <option value="planned">Planned</option>
            <option value="stale">Stale only</option>
            <option value="ended">Ended</option>
          </Select>
        </div>

        {!filtered.length ? (
          <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 text-slate-500 shadow-sm">
              <SearchX className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-100">
              No matching live trips
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Adjust the search text or status filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const active = item.trip.tripId === selectedTripId;

              return (
                <Button
                  key={item.trip.tripId}
                  variant={active ? "primary" : "secondary"}
                  size="auto"
                  className={`h-auto w-full justify-start rounded-sm px-4 py-4 text-left ${
                    active ? "border border-slate-900" : ""
                  }`}
                  onClick={() => onSelect(item.trip.tripId)}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.trip.routeName ?? "University route"}
                        </p>
                        <p
                          className={`mt-1 font-mono text-xs ${
                            active ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {shortTripRef(item.trip.tripId)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge tone={item.isStale ? "warning" : "success"}>
                          {item.isStale ? "Stale" : "Fresh"}
                        </Badge>
                        <Badge tone={active ? "info" : "neutral"}>
                          {item.trip.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.trip.activationMode ? (
                        <Badge tone="neutral">{item.trip.activationMode}</Badge>
                      ) : null}
                      <Badge tone="info">
                        {sourceLabel(
                          item.selectedSource?.sourceType,
                          item.selectedSource?.sourceLabel,
                        )}
                      </Badge>
                      <Badge
                        tone={toneForSourceStatus(
                          item.selectedSource?.sourceStatus,
                        )}
                      >
                        {sourceStatusText(item.selectedSource?.sourceStatus)}
                      </Badge>
                    </div>

                    <div
                      className={`mt-4 grid gap-2 text-xs ${
                        active ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      <p>
                        Bus: {item.trip.busLabel ?? item.trip.busId ?? "N/A"}
                        {item.trip.plateNumber
                          ? ` • ${item.trip.plateNumber}`
                          : ""}
                      </p>
                      <p>Driver: {item.trip.driverName ?? "N/A"}</p>
                      <p>
                        ETA:{" "}
                        {item.eta?.etaMinutes != null
                          ? `${item.eta.etaMinutes} min`
                          : "N/A"}
                      </p>
                      <p>
                        Last update:{" "}
                        {item.liveState?.updatedAt
                          ? formatRelativeTime(item.liveState.updatedAt)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
