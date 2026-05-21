"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import type { AdminEventItem } from "@/features/admin/types";

interface AdminEventFeedProps {
  events: AdminEventItem[];
  /** Number of events visible before the "See all" toggle. Default 5. */
  collapsedCount?: number;
}

function toneForType(type: string) {
  switch (type) {
    case "TRIP_STARTED":
      return "success";
    case "ETA_UPDATED":
      return "warning";
    case "TRIP_ENDED":
      return "danger";
    case "STALE_ALERT":
      return "warning";
    case "DRIVER_ASSIGNED":
    case "DRIVER_UNASSIGNED":
      return "info";
    case "SYSTEM_ALERT":
    default:
      return "neutral";
  }
}

function typeLabel(type: string) {
  const known: Record<string, string> = {
    TRIP_STARTED: "Trip started",
    TRIP_ENDED: "Trip ended",
    ETA_UPDATED: "ETA updated",
    STALE_ALERT: "Stale alert",
    DRIVER_ASSIGNED: "Driver assigned",
    DRIVER_UNASSIGNED: "Driver unassigned",
    SYSTEM_ALERT: "System alert",
  };

  return (
    known[type] ??
    type
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function AdminEventFeed({
  events,
  collapsedCount = 5,
}: AdminEventFeedProps) {
  const [expanded, setExpanded] = useState(false);

  const hiddenCount = Math.max(0, events.length - collapsedCount);
  const visibleEvents =
    expanded || events.length <= collapsedCount
      ? events
      : events.slice(0, collapsedCount);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Activity feed</CardTitle>
            <CardDescription>Recent trip and system activity.</CardDescription>
          </div>
          {events.length ? <Badge tone="neutral">{events.length}</Badge> : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!events.length ? (
          <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center text-sm text-slate-500">
            No operations events yet.
          </div>
        ) : (
          <>
            {visibleEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-sm border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100">
                        {event.title}
                      </p>
                      <Badge tone={toneForType(event.type)}>
                        {typeLabel(event.type)}
                      </Badge>
                    </div>
                    <p className="mt-2 break-words text-sm text-slate-400">
                      {event.description}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <p>{formatRelativeTime(event.createdAt)}</p>
                    <p className="mt-1">{formatDateTime(event.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}

            {hiddenCount > 0 ? (
              <div className="flex justify-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      See all {events.length} events
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
