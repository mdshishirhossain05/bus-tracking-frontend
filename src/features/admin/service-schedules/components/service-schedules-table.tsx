"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServiceScheduleItem } from "../api/admin.service-schedules.api";
import type { ServiceScheduleActionType } from "./service-schedule-delete-dialog";
import { AdminTableShell } from "../../shared/components/admin-table-shell";

interface ServiceSchedulesTableProps {
  items: ServiceScheduleItem[];
  onEdit: (item: ServiceScheduleItem) => void;
  onAction: (
    actionType: ServiceScheduleActionType,
    item: ServiceScheduleItem,
  ) => void;
}

export function ServiceSchedulesTable({
  items,
  onEdit,
  onAction,
}: ServiceSchedulesTableProps) {
  return (
    <AdminTableShell>
      <table className="w-full min-w-[1260px] text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="px-5 py-4">Route</th>
            <th className="px-5 py-4">Bus</th>
            <th className="px-5 py-4">Driver</th>
            <th className="px-5 py-4">Day</th>
            <th className="px-5 py-4">Time</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Trips</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-800">
              <td className="px-5 py-4 align-top">
                <div className="font-medium text-slate-100">{item.routeName}</div>
                <div className="mt-1 text-xs text-slate-500">{item.routeId}</div>
              </td>

              <td className="px-5 py-4 align-top">
                <div className="font-medium text-slate-100">{item.busCode}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.plateNumber ?? "No plate"}
                </div>
              </td>

              <td className="px-5 py-4 align-top">
                <div className="font-medium text-slate-100">{item.driverName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.driverEmail}
                </div>
              </td>

              <td className="px-5 py-4 align-top">{item.dayType}</td>
              <td className="px-5 py-4 align-top">{item.departureTime}</td>

              <td className="px-5 py-4 align-top">
                <Badge tone={item.isActive ? "success" : "warning"}>
                  {item.isActive ? "Active" : "Archived"}
                </Badge>
              </td>

              <td className="px-5 py-4 align-top">{item.tripCount}</td>

              <td className="px-5 py-4 text-right align-top">
                <div className="flex flex-wrap justify-end gap-2">
                  {item.isActive ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAction("archive", item)}
                      >
                        Archive
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAction("restore", item)}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onAction("permanent-delete", item)}
                      >
                        Permanent Delete
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTableShell>
  );
}