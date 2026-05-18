"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { getAuditLogs, type AuditLogItem } from "./api/audit-logs.api";

interface Filters {
  action: string;
  entityType: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { action: "", entityType: "", from: "", to: "" };

export function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await getAuditLogs({
        page,
        limit: 20,
        action: appliedFilters.action.trim() || undefined,
        entityType: appliedFilters.entityType.trim() || undefined,
        from: appliedFilters.from || undefined,
        to: appliedFilters.to || undefined,
      });
      setItems(res.items);
      setMeta(res.meta);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setAppliedFilters(draftFilters);
  }

  function resetFilters() {
    setPage(1);
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  }

  if (loading && items.length === 0) {
    return <SectionSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        description="Failed to load audit logs. Please try again."
        onRetry={() => void load()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_150px_auto]">
          <Input
            placeholder="Action (e.g. LOGIN_SUCCESS)"
            value={draftFilters.action}
            onChange={(e) =>
              setDraftFilters((prev) => ({ ...prev, action: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          <Input
            placeholder="Entity type (e.g. User, Trip)"
            value={draftFilters.entityType}
            onChange={(e) =>
              setDraftFilters((prev) => ({
                ...prev,
                entityType: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          <Input
            type="date"
            aria-label="From date"
            value={draftFilters.from}
            onChange={(e) =>
              setDraftFilters((prev) => ({ ...prev, from: e.target.value }))
            }
          />
          <Input
            type="date"
            aria-label="To date"
            value={draftFilters.to}
            onChange={(e) =>
              setDraftFilters((prev) => ({ ...prev, to: e.target.value }))
            }
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
          title="No audit logs"
          description="No audit events match the current filters."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-100">
                        {log.action}
                      </span>
                      {log.method ? (
                        <span className="ml-2 text-xs text-slate-500">
                          {log.method}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {log.actorName ? (
                        <div>
                          <p className="text-slate-100">{log.actorName}</p>
                          <p className="text-xs text-slate-500">
                            {log.actorRole ?? "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          System / anonymous
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.entityType}
                      {log.entityId ? (
                        <span className="block max-w-[220px] truncate text-xs text-slate-500">
                          {log.entityId}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.ip ?? "—"}
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
          Page {meta.page} of {meta.totalPages} · {meta.total} events
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
