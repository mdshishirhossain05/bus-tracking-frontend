import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/format";
import type { AdminEventItem } from "@/features/admin/types";

interface AdminEventFeedProps {
  events: AdminEventItem[];
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

export function AdminEventFeed({ events }: AdminEventFeedProps) {
  return (
    <Card className="min-h-[420px]">
      <CardHeader>
        <CardTitle>Operations Event Feed</CardTitle>
        <CardDescription>
          Latest persisted system and trip activity events.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {!events.length ? (
          <div className="rounded-sm border border-dashed border-slate-800 bg-slate-950 px-4 py-10 text-center text-sm text-slate-500">
            No operations events yet.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-sm border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {event.title}
                    </p>
                    <Badge tone={toneForType(event.type)}>{event.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {event.description}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p>{formatRelativeTime(event.createdAt)}</p>
                  <p className="mt-1">{formatDateTime(event.createdAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}