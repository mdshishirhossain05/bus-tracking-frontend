import { useMemo } from "react";
import {
  BusFront,
  IdCard,
  Route,
  UserRound,
  MapPin,
  CheckCircle2,
  CircleDot,
  ArrowRightCircle,
  Clock3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActiveTrip, PassengerLocation, TripEta } from "@/types/trip";
import type { TripStopArrivalPayload } from "@/types/socket";
import { formatCoordinate } from "@/lib/utils/format";
import { useRoutePresentation } from "@/features/routes/hooks/use-route-presentation";
import type { RouteStop } from "@/features/routes/types";

interface LiveTripDetailsProps {
  trip?: ActiveTrip | null;
  eta?: TripEta | null;
  passengerLocation?: PassengerLocation | null;
  recentArrival?: TripStopArrivalPayload | null;
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-slate-800 bg-slate-950 p-4">
      <div className="shrink-0 rounded-sm bg-slate-900 p-2 text-slate-300 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className="mt-2 break-all text-sm font-medium text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
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
  eta?: TripEta | null;
  recentArrival?: TripStopArrivalPayload | null;
}): TimelineStopItem[] {
  const { stops, eta, recentArrival } = params;

  if (!stops.length) return [];

  const arrivedIndex = getStopIndexById(stops, recentArrival?.stopId);

  const passengerNearestIndex = getStopIndexById(
    stops,
    eta?.passengerNearestStop?.stopId,
  );

  const etaNextIndex = getStopIndexByName(stops, eta?.nextStopName);
  const etaNearestIndex = getStopIndexByName(stops, eta?.nearestStopName);

  let nextIndex =
    etaNextIndex >= 0
      ? etaNextIndex
      : passengerNearestIndex >= 0
        ? passengerNearestIndex
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

    if (eta?.finalStopReached && index === stops.length - 1) {
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

export function LiveTripDetails({
  trip,
  eta,
  passengerLocation,
  recentArrival,
}: LiveTripDetailsProps) {
  const { data: routePresentation } = useRoutePresentation(trip?.routeId);

  const timelineItems = useMemo(
    () =>
      buildTimelineItems({
        stops: routePresentation?.stops ?? [],
        eta,
        recentArrival,
      }),
    [routePresentation?.stops, eta, recentArrival],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip details</CardTitle>
        <CardDescription>
          Your bus, driver, nearest stop, and live stop-by-stop progress.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DetailRow
            label="Status"
            value={trip?.status ?? "Active"}
            icon={<IdCard className="h-4 w-4" />}
          />
          <DetailRow
            label="Route"
            value={trip?.routeName ?? "University route"}
            icon={<Route className="h-4 w-4" />}
          />
          <DetailRow
            label="Vehicle"
            value={trip?.busLabel ?? "Assigned bus"}
            icon={<BusFront className="h-4 w-4" />}
          />
          <DetailRow
            label="Driver"
            value={trip?.driverName ?? "On duty"}
            icon={<UserRound className="h-4 w-4" />}
          />
          <DetailRow
            label="Your Nearest Stop"
            value={eta?.passengerNearestStop?.stopName ?? "N/A"}
            icon={<MapPin className="h-4 w-4" />}
          />
          <DetailRow
            label="Your Location"
            value={
              eta?.passengerNearestStop?.stopName
                ? `Near ${eta.passengerNearestStop.stopName}`
                : passengerLocation
                  ? `${formatCoordinate(
                      passengerLocation.latitude,
                    )}, ${formatCoordinate(passengerLocation.longitude)}`
                  : "Location unavailable"
            }
            icon={<MapPin className="h-4 w-4" />}
          />
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-100">
              Stop progression
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Updates live as the bus passes each stop.
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
              Stop-by-stop progress will appear once the route loads.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
