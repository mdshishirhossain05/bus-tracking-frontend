import { api } from "@/lib/api/axios";

export type ArrivalDelayStatus = "ON_TIME" | "LATE" | "EARLY" | "NO_SCHEDULE";

export interface DelayReportItem {
  id: string;
  tripId: string;
  routeName: string | null;
  stopName: string | null;
  scheduledTime: string | null;
  actualArrivalTime: string;
  delayMinutes: number;
  status: ArrivalDelayStatus;
}

export interface DelayReportSummary {
  totalArrivals: number;
  onTime: number;
  late: number;
  early: number;
  noSchedule: number;
  averageDelayMinutes: number | null;
  latePercentage: number;
  onTimePercentage: number;
}

export interface DelayReportResponse {
  summary: DelayReportSummary;
  items: DelayReportItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const EMPTY_SUMMARY: DelayReportSummary = {
  totalArrivals: 0,
  onTime: 0,
  late: 0,
  early: 0,
  noSchedule: 0,
  averageDelayMinutes: null,
  latePercentage: 0,
  onTimePercentage: 0,
};

export async function getDelayReport(params: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}): Promise<DelayReportResponse> {
  const res = await api.get("/admin/analytics/delays", { params });
  const data = res.data?.data ?? res.data ?? {};
  const items: DelayReportItem[] = Array.isArray(data.items) ? data.items : [];
  const meta = data.meta ?? {};

  return {
    summary: { ...EMPTY_SUMMARY, ...(data.summary ?? {}) },
    items,
    meta: {
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? 20),
      total: Number(meta.total ?? items.length),
      totalPages: Number(meta.totalPages ?? 1),
    },
  };
}
