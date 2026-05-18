"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type {
  AdminAssignedRouteStop,
  AdminStopLite,
  RouteGeometryPoint,
} from "../api/admin.route-stops.api";

const RouteStopsGoogleMap = dynamic(
  () =>
    import("./route-stops-map-panel-inner").then(
      (mod) => mod.RouteStopsGoogleMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-sm border border-slate-800 bg-slate-950 text-sm text-slate-500">
        Loading route map...
      </div>
    ),
  },
);

export function RouteStopsMapPanel({
  assignedStops,
  unassignedStops,
  geometry,
}: {
  assignedStops: AdminAssignedRouteStop[];
  unassignedStops: AdminStopLite[];
  geometry: RouteGeometryPoint[];
}) {
  const summary = useMemo(() => {
    return {
      assigned: assignedStops.length,
      available: unassignedStops.length,
    };
  }, [assignedStops.length, unassignedStops.length]);

  return (
    <div className="space-y-3 rounded-sm border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            Route map visualization
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Visualize assigned stop order, nearby available stops, and the saved route path.
          </p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
          {summary.assigned} assigned • {summary.available} available
        </div>
      </div>

      <div className="h-[320px] overflow-hidden rounded-sm border border-slate-800 sm:h-[420px]">
        <RouteStopsGoogleMap
          assignedStops={assignedStops}
          unassignedStops={unassignedStops}
          geometry={geometry}
        />
      </div>
    </div>
  );
}