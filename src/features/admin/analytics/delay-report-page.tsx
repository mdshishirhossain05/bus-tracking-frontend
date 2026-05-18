"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, Gauge, TimerReset, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import type { Tone } from "@/types/ui";
import {
  getDelayReport,
  type ArrivalDelayStatus,
  type DelayReportItem,
  type DelayReportResponse,
} from "./api/delay-report.api";

const STATUS_TONE: Record<ArrivalDelayStatus, Tone> = {
  ON_TIME: "success",
  LATE: "danger",
  EARLY: "warning",
  NO_SCHEDULE: "neutral",
};

const STATUS_LABEL: Record<ArrivalDelayStatus, string> = {
  ON_TIME: "On time",
  LATE: "Late",
  EARLY: "Early",
  NO_SCHEDULE: "No schedule",
};

function formatDelay(minutes: number, status: ArrivalDelayStatus) {
  if (status === "NO_SCHEDULE") return "—";
  if (minutes === 0) return "On time";
  const abs = Math.abs(minutes);
  return minutes > 0 ? `${abs} min late` : `${abs} min early`;
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function DelayReportPage() {
  const [data, setData] = useState<DelayReportResponse | null>(null);
  const [page, setPage] = useState(1);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await getDelayReport({
        page,
        limit: 20,
        from: appliedFrom || undefined,
        to: appliedTo || undefined,
      });
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFrom, appliedTo]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setAppliedFrom(draftFrom);
    setAppliedTo(draftTo);
  }

  function resetFilters() {
    setPage(1);
    setDraftFrom("");
    setDraftTo("");
    setAppliedFrom("");
    setAppliedTo("");
  }

  if (loading && !data) {
    return <SectionSkeleton />;
  }

  if (error || !data) {
    return (
      <ErrorState
        description="Failed to load the delay report. Please try again."
        onRetry={() => void load()}
      />
    );
  }

  const { summary, items, meta } = data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Arrivals"
          value={summary.totalArrivals}
          helper="Recorded stop arrivals in range"
          tone="info"
          icon={<Gauge className="h-5 w-5" />}
        />
        <StatCard
          label="On-Time Rate"
          value={`${summary.onTimePercentage}%`}
          helper={`${summary.onTime} on-time of scheduled arrivals`}
          tone={summary.onTimePercentage >= 80 ? "success" : "warning"}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label="Late Arrivals"
          value={summary.late}
          helper={`${summary.latePercentage}% of scheduled arrivals`}
          tone={summary.late > 0 ? "danger" : "success"}
          icon={<TriangleAlert className="h-5 w-5" />}
        />
        <StatCard
          label="Average Delay"
          value={
            summary.averageDelayMinutes != null
              ? `${summary.averageDelayMinutes} min`
              : "N/A"
          }
          helper="Across scheduled arrivals"
          tone="neutral"
          icon={<TimerReset className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[150px_150px_auto]">
          <Input
            type="date"
            aria-label="From date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
          <Input
            type="date"
            aria-label="To date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="secondary" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="No arrivals recorded"
          description="No stop arrivals match the selected date range."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Arrived</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Stop</th>
                  <th className="px-4 py-3 font-medium">Delay</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item: DelayReportItem) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {formatTime(item.actualArrivalTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.routeName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-100">
                      {item.stopName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDelay(item.delayMinutes, item.status)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[item.status]}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Page {meta.page} of {meta.totalPages} · {meta.total} arrivals
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
