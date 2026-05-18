"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdminAssignedRouteStop } from "../api/admin.route-stops.api";

interface AssignedStopsPanelProps {
  routeName?: string;
  stops: AdminAssignedRouteStop[];
  onMoveUp: (stopId: string) => void;
  onMoveDown: (stopId: string) => void;
  onRemove: (stopId: string) => void;
  onReorder: (stopId: string, targetIndex: number) => void;
}

export function AssignedStopsPanel({
  routeName,
  stops,
  onMoveUp,
  onMoveDown,
  onRemove,
  onReorder,
}: AssignedStopsPanelProps) {
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-100">
              Assigned stops
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {routeName
                ? `Ordered stop sequence for ${routeName}.`
                : "Select a route to manage its stop order."}
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">
            {stops.length} assigned
          </div>
        </div>

        <div className="space-y-3">
          {stops.length === 0 ? (
            <div className="rounded-sm border border-dashed border-slate-800 px-4 py-8 text-sm text-slate-500">
              No stops assigned yet. Add stops from the left panel.
            </div>
          ) : (
            stops.map((stop, index) => (
              <div
                key={stop.stopId}
                draggable
                onDragStart={() => setDraggingStopId(stop.stopId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!draggingStopId) return;
                  onReorder(draggingStopId, index);
                  setDraggingStopId(null);
                }}
                onDragEnd={() => setDraggingStopId(null)}
                className={`rounded-sm border px-4 py-4 transition ${
                  draggingStopId === stop.stopId
                    ? "border-slate-700 bg-slate-950"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 cursor-grab rounded-sm border border-slate-800 bg-slate-950 p-2 text-slate-500 active:cursor-grabbing"
                      aria-label={`Drag to reorder ${stop.stopName}`}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                          {index + 1}
                        </div>
                        <p className="font-medium text-slate-100">{stop.stopName}</p>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {stop.lat}, {stop.lng}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Distance from start:{" "}
                        {stop.distanceFromStartKm == null
                          ? "Calculated automatically after save"
                          : `${stop.distanceFromStartKm.toFixed(3)} km`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onMoveUp(stop.stopId)}
                      disabled={index === 0}
                      className="w-full sm:w-auto"
                    >
                      <ArrowUp className="h-4 w-4" />
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onMoveDown(stop.stopId)}
                      disabled={index === stops.length - 1}
                      className="w-full sm:w-auto"
                    >
                      <ArrowDown className="h-4 w-4" />
                      Down
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRemove(stop.stopId)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}