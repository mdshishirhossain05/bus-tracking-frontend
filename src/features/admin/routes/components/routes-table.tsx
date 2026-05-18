"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminRouteItem } from "../api/admin.routes.api";
import { AdminTableShell } from "../../shared/components/admin-table-shell";

interface RoutesTableProps {
  routes: AdminRouteItem[];
  onEdit: (route: AdminRouteItem) => void;
  onDelete: (route: AdminRouteItem) => void;
}

export function RoutesTable({
  routes,
  onEdit,
  onDelete,
}: RoutesTableProps) {
  return (
    <AdminTableShell>
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-slate-500">
            <th className="px-5 py-4 font-medium">Route</th>
            <th className="px-5 py-4 font-medium">Description</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr
              key={route.id}
              className="border-b border-slate-800 last:border-b-0"
            >
              <td className="px-5 py-4 align-top">
                <div className="font-medium text-slate-100">{route.routeName}</div>
                <div className="mt-1 text-xs text-slate-500">{route.id}</div>
              </td>

              <td className="px-5 py-4 align-top text-slate-400">
                {route.description?.trim() ? route.description : "—"}
              </td>

              <td className="px-5 py-4 align-top">
                <Badge tone={route.isActive ? "success" : "warning"}>
                  {route.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>

              <td className="px-5 py-4 text-right align-top">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(route)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(route)}
                  >
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