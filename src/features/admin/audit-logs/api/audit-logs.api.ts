import { api } from "@/lib/api/axios";

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorEmail: string | null;
  route: string | null;
  method: string | null;
  ip: string | null;
  requestId: string | null;
  metaJson: unknown;
  createdAt: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}): Promise<AuditLogsResponse> {
  const res = await api.get("/admin/audit-logs", { params });
  const data = res.data?.data ?? res.data ?? {};
  const items: AuditLogItem[] = Array.isArray(data.items) ? data.items : [];
  const meta = data.meta ?? {};

  return {
    items,
    meta: {
      page: Number(meta.page ?? 1),
      limit: Number(meta.limit ?? 20),
      total: Number(meta.total ?? items.length),
      totalPages: Number(meta.totalPages ?? 1),
    },
  };
}
