"use client";

import { useMemo, useState } from "react";
import { Clock3, Search, SearchX, Star } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/utils/format";
import type { ActiveTrip, LiveBusLocation } from "@/types/trip";

interface TripSelectorPanelProps {
  trips: ActiveTrip[];
  selectedTripId?: string;
  liveState?: LiveBusLocation | null;
  onSelect: (tripId: string) => void;
  favoriteRouteIds?: Set<string>;
  onToggleFavorite?: (routeId: string) => void;
}

export function TripSelectorPanel({
  trips,
  selectedTripId,
  liveState,
  onSelect,
  favoriteRouteIds,
  onToggleFavorite,
}: TripSelectorPanelProps) {
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");

  const routeOptions = useMemo(() => {
    const map = new Map<string, string>();

    trips.forEach((trip) => {
      map.set(trip.routeId, trip.routeName ?? trip.routeId);
    });

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [trips]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesRoute =
        routeFilter === "all" ? true : trip.routeId === routeFilter;

      const haystack = [
        trip.tripId,
        trip.routeId,
        trip.routeName ?? "",
        trip.busLabel ?? "",
        trip.busId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = q ? haystack.includes(q) : true;

      return matchesRoute && matchesSearch;
    });
  }, [trips, routeFilter, search]);

  return (
    <Card className="min-h-[720px]">
      <CardHeader className="pb-3">
        <CardTitle>Active buses</CardTitle>
        <CardDescription>
          Pick a running bus to follow it live on the map.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search route or bus..."
              className="pl-9"
            />
          </div>

          <Select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
          >
            <option value="all">All routes</option>
            {routeOptions.map((route) => (
              <option key={route.value} value={route.value}>
                {route.label}
              </option>
            ))}
          </Select>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-slate-900 text-slate-500 shadow-sm">
              <SearchX className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-100">
              No matching active trips
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Try adjusting your search text or route filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => {
              const active = trip.tripId === selectedTripId;
              const freshForThisTrip =
                liveState?.tripId === trip.tripId ? liveState.updatedAt : null;

              return (
                <Button
                  key={trip.tripId}
                  variant={active ? "primary" : "secondary"}
                  size="auto"
                  className={`h-auto w-full justify-start rounded-sm px-4 py-4 text-left ${
                    active ? "border border-slate-900" : ""
                  }`}
                  onClick={() => onSelect(trip.tripId)}
                >
                  <div className="w-full min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {trip.routeName ?? "University route"}
                        </p>
                        <p
                          className={`mt-1 truncate text-xs ${
                            active ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {trip.busLabel ?? trip.busId ?? "Bus in service"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {onToggleFavorite ? (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={
                              favoriteRouteIds?.has(trip.routeId)
                                ? "Remove route from favorites"
                                : "Add route to favorites"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(trip.routeId);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleFavorite(trip.routeId);
                              }
                            }}
                            className="rounded-sm p-1 text-slate-400 transition-colors hover:text-amber-400"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                favoriteRouteIds?.has(trip.routeId)
                                  ? "fill-amber-400 text-amber-400"
                                  : ""
                              }`}
                            />
                          </span>
                        ) : null}

                        <Badge tone={active ? "info" : "neutral"}>
                          {trip.status}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={`mt-4 flex items-center gap-2 text-xs ${
                        active ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      <Clock3 className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-words">
                        {freshForThisTrip
                          ? `Updated ${formatRelativeTime(freshForThisTrip)}`
                          : "Waiting for live update…"}
                      </span>
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
