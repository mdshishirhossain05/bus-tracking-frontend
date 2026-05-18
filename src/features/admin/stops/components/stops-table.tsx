"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StopItem } from "../api/admin.stops.api";
import { AdminTableShell } from "../../shared/components/admin-table-shell";

interface Props {
  stops: StopItem[];
  onEdit: (stop: StopItem) => void;
  onDelete: (stop: StopItem) => void;
}

export function StopsTable({ stops, onEdit, onDelete }: Props) {
  return (
    <AdminTableShell>
      <table className="w-full min-w-[1080px] text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="px-5 py-4">Stop</th>
            <th className="px-5 py-4">Metadata</th>
            <th className="px-5 py-4">Location</th>
            <th className="px-5 py-4">Usage</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stops.map((s) => (
            <tr key={s.id} className="border-t border-slate-800 align-top">
              <td className="px-5 py-4">
                <div className="space-y-2">
                  <p className="font-medium text-slate-100">{s.stopName}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.stopCode ? <Badge tone="info">{s.stopCode}</Badge> : null}
                    <Badge tone={s.isActive ? "success" : "warning"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-slate-400">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium text-slate-300">Landmark:</span>{" "}
                    {s.landmark || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-300">Address:</span>{" "}
                    {s.address || "—"}
                  </p>
                </div>
              </td>

              <td className="px-5 py-4 text-slate-400">
                <div className="space-y-1">
                  <p>{s.lat}</p>
                  <p>{s.lng}</p>
                </div>
              </td>

              <td className="px-5 py-4 text-slate-400">
                <div className="space-y-1">
                  <p>Routes: {s.usageSummary?.routeStops ?? 0}</p>
                  <p>Schedules: {s.usageSummary?.schedules ?? 0}</p>
                  <p>Arrivals: {s.usageSummary?.stopArrivals ?? 0}</p>
                </div>
              </td>

              <td className="px-5 py-4 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(s)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTableShell>
  );
}