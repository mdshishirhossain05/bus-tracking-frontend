"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminStopLite } from "../api/admin.route-stops.api";

interface AvailableStopsPanelProps {
  stops: AdminStopLite[];
  onAdd: (stop: AdminStopLite) => void;
}

export function AvailableStopsPanel({
  stops,
  onAdd,
}: AvailableStopsPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stops;

    return stops.filter((stop) => {
      return (
        stop.stopName.toLowerCase().includes(q) ||
        String(stop.lat).includes(q) ||
        String(stop.lng).includes(q)
      );
    });
  }, [query, stops]);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            Available stops
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add stops into the selected route in operational order.
          </p>
        </div>

        <Input
          placeholder="Search available stops"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-[420px] space-y-2 overflow-auto pr-1 xl:max-h-[560px]">
          {filtered.length === 0 ? (
            <div className="rounded-sm border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
              No stops available for the current filter.
            </div>
          ) : (
            filtered.map((stop) => (
              <div
                key={stop.id}
                className="flex flex-col gap-3 rounded-sm border border-slate-800 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">{stop.stopName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stop.lat}, {stop.lng}
                  </p>
                </div>

                <Button size="sm" onClick={() => onAdd(stop)} className="w-full sm:w-auto">
                  Add
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}