import { useMemo } from "react";
import {
  BusFront,
  Route,
  UserRound,
  Activity,
  MapPinned,
  CheckCircle2,
  CircleDot,
  ArrowRightCircle,
  Clock3,
  Satellite,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DriverCurrentTrip,
  DriverTripLiveState,
} from "@/features/driver/types.current";
import type { RoutePresentation, RouteStop } from "@/features/routes/types";
import type { TripStopArrivalPayload } from "@/types/socket";

interface DriverAssignedTripCardProps {
  trip?: DriverCurrentTrip | null;
  liveState?: DriverTripLiveState | null;
  routePresentation?: RoutePresentation | null;
  recentArrival?: TripStopArrivalPayload | null;
  nextStopId?: string | null;
  nextStopName?: string | null;
  etaMinutes?: number | null;
}

type TimelineStopState = "passed" | "current" | "next" | "upcoming";

type TimelineStopItem = {
  stop: RouteStop;
  state: TimelineStopState;
};

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase() ?? null;
}

function getStopIndexByName(stops: RouteStop[], name?: string | null) {
  const normalized = normalizeName(name);
  if (!normalized) return -1;

  return stops.findIndex((stop) => normalizeName(stop.name) === normalized);
}

function getStopIndexById(stops: RouteStop[], stopId?: string | null) {
  if (!stopId) return -1;
  return stops.findIndex((stop) => stop.id === stopId);
}

function buildTimelineItems(params: {
  stops: RouteStop[];
  trip?: DriverCurrentTrip | null;
  recentArrival?: TripStopArrivalPayload | null;
  nextStopId?: string | null;
  nextStopName?: string | null;
}): TimelineStopItem[] {
  const { stops, trip, recentArrival, nextStopId, nextStopName } = params;

  if (!stops.length) return [];

  const arrivedIndex = getStopIndexById(stops, recentArrival?.stopId);
  const explicitNextIndex = getStopIndexById(stops, nextStopId);

  const etaNextIndex = getStopIndexByName(
    stops,
    nextStopName ?? trip?.eta?.nextStopName,
  );

  const etaNearestIndex = getStopIndexByName(stops, trip?.eta?.nearestStopName);

  let nextIndex =
    explicitNextIndex >= 0
      ? explicitNextIndex
      : etaNextIndex >= 0
        ? etaNextIndex
        : -1;

  if (arrivedIndex >= 0 && nextIndex <= arrivedIndex) {
    nextIndex = arrivedIndex + 1 < stops.length ? arrivedIndex + 1 : -1;
  }

  let currentIndex =
    arrivedIndex >= 0
      ? arrivedIndex
      : etaNearestIndex >= 0
        ? etaNearestIndex
        : nextIndex > 0
          ? nextIndex - 1
          : 0;

  if (currentIndex >= stops.length) {
    currentIndex = stops.length - 1;
  }

  return stops.map((stop, index) => {
    let state: TimelineStopState = "upcoming";

    if (arrivedIndex >= 0) {
      if (index <= arrivedIndex) state = "passed";
      else if (index === nextIndex) state = "next";
      else state = "upcoming";
    } else if (nextIndex >= 0) {
      if (index < currentIndex) state = "passed";
      else if (index === currentIndex) state = "current";
      else if (index === nextIndex) state = "next";
      else state = "upcoming";
    } else {
      if (index < currentIndex) state = "passed";
      else if (index === currentIndex) state = "current";
      else state = "upcoming";
    }

    if (index === stops.length - 1 && nextIndex < 0 && arrivedIndex === index) {
      state = "passed";
    }

    return { stop, state };
  });
}

function getStopStateIcon(state: TimelineStopState) {
  switch (state) {
    case "passed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "current":
      return <CircleDot className="h-4 w-4" />;
    case "next":
      return <ArrowRightCircle className="h-4 w-4" />;
    case "upcoming":
    default:
      return <Clock3 className="h-4 w-4" />;
  }
}

function getStopStateTone(state: TimelineStopState) {
  switch (state) {
    case "passed":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
    case "current":
      return "bg-blue-500/10 border-blue-500/30 text-blue-300";
    case "next":
      return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    case "upcoming":
    default:
      return "bg-slate-950 border-slate-800 text-slate-500";
  }
}

function getStopStateLabel(state: TimelineStopState) {
  switch (state) {
    case "passed":
      return "Passed";
    case "current":
      return "Current";
    case "next":
      return "Next";
    case "upcoming":
    default:
      return "Upcoming";
  }
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

function sourceLabel(liveState?: any) {
  if (liveState?.source) return liveState.source;
  if (liveState?.sourceType === "GPS_DEVICE") return "GPS Device";
  if (liveState?.sourceType === "DRIVER_MOBILE") return "Driver Mobile";
  return "Unknown Source";
}

function getAccuracyText(liveState?: any) {
  const accuracy = liveState?.accuracyM;

  if (typeof accuracy === "number" && Number.isFinite(accuracy)) {
    return `${Math.round(accuracy)} m`;
  }

  return "N/A";
}

export function DriverAssignedTripCard({
  trip,
  liveState,
  routePresentation,
  recentArrival,
  nextStopId,
  nextStopName,
  etaMinutes,
}: DriverAssignedTripCardProps) {
  const started = trip?.status === "RUNNING";
  const isPlanned = trip?.status === "PLANNED";

  const timelineItems = useMemo(
    () =>
      buildTimelineItems({
        stops: routePresentation?.stops ?? [],
        trip,
        recentArrival,
        nextStopId,
        nextStopName,
      }),
    [routePresentation?.stops, trip, recentArrival, nextStopId, nextStopName],
  );

  const currentLiveState = liveState ?? trip?.liveState ?? null;
  const isGpsSelected = currentLiveState?.sourceType === "GPS_DEVICE";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Assigned Trip</CardTitle>
            <CardDescription>
              Current driver assignment, route context, backend live state, and
              stop progression.
            </CardDescription>
          </div>

          <Badge tone={started ? "success" : isPlanned ? "info" : "neutral"}>
            {started ? "Trip active" : trip ? trip.status : "No trip"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <p className="text-lg font-semibold text-slate-100">
            {trip?.routeName ?? "No assigned trip"}
          </p>
          <p className="mt-1 break-all text-sm text-slate-500">
            Trip ID: {trip?.tripId ?? "N/A"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={started ? "success" : "neutral"}>
              {started ? "Running" : trip?.status ?? "N/A"}
            </Badge>
            <Badge tone="neutral">Bus: {trip?.busLabel ?? "N/A"}</Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <BusFront className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                Vehicle
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">
              {trip?.busLabel ?? "N/A"}
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Route className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                Route
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">
              {trip?.routeName ?? trip?.routeId ?? "N/A"}
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <UserRound className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                Driver
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">
              {trip?.driverName ?? "N/A"}
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                ETA
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">
              {etaMinutes != null ? `${etaMinutes} min` : "N/A"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Next stop: {nextStopName ?? trip?.eta?.nextStopName ?? "N/A"}
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 sm:col-span-2">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPinned className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-[0.14em]">
                Live backend state
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge tone={currentLiveState?.isStale ? "warning" : "success"}>
                {currentLiveState?.isStale ? "Stale location" : "Fresh location"}
              </Badge>
              <Badge tone="info">
                {isGpsSelected ? (
                  <Satellite className="h-3.5 w-3.5" />
                ) : (
                  <Smartphone className="h-3.5 w-3.5" />
                )}
                {sourceLabel(currentLiveState)}
              </Badge>
              <Badge tone={toneForSourceStatus(currentLiveState?.sourceStatus)}>
                {currentLiveState?.sourceStatus ?? "UNKNOWN"}
              </Badge>
              {currentLiveState?.selectionReason ? (
                <Badge tone="neutral">{currentLiveState.selectionReason}</Badge>
              ) : null}
              <Badge tone="neutral">
                Accuracy: {getAccuracyText(currentLiveState)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-100">
              Stop Progression Timeline
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Uses live arrival events and backend next-stop ETA context.
            </p>
          </div>

          {timelineItems.length ? (
            <div className="space-y-3">
              {timelineItems.map((item) => (
                <div
                  key={item.stop.id}
                  className={`flex items-start gap-3 rounded-sm border p-3 ${getStopStateTone(
                    item.state,
                  )}`}
                >
                  <div className="mt-0.5">{getStopStateIcon(item.state)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{item.stop.name}</p>
                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-[11px] font-medium">
                        {getStopStateLabel(item.state)}
                      </span>
                      <span className="text-[11px] font-medium opacity-80">
                        Stop #{item.stop.order}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
              Stop progression will appear once route presentation data is
              available.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}