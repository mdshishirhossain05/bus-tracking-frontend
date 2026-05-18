"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminBusItem } from "../api/admin.buses.api";
import { AdminTableShell } from "../../shared/components/admin-table-shell";

interface BusesTableProps {
  buses: AdminBusItem[];
  onEdit: (bus: AdminBusItem) => void;
  onDelete: (bus: AdminBusItem) => void;
  onAssignGps: (bus: AdminBusItem) => void;
  onUnassignGps: (bus: AdminBusItem) => void;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function gpsTone(status?: string | null) {
  switch (status) {
    case "HEALTHY":
      return "success";
    case "STALE":
      return "warning";
    case "UNHEALTHY":
    case "DISCONNECTED":
      return "danger";
    default:
      return "neutral";
  }
}

function traccarTone(status?: string | null) {
  switch (status) {
    case "SYNCED":
      return "success";
    case "LINKED":
      return "info";
    case "ERROR":
      return "danger";
    case "UNLINKED":
    default:
      return "neutral";
  }
}

export function BusesTable({
  buses,
  onEdit,
  onDelete,
  onAssignGps,
  onUnassignGps,
}: BusesTableProps) {
  return (
    <AdminTableShell>
      <table className="w-full min-w-[1340px] text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-slate-500">
            <th className="px-5 py-4 font-medium">Bus</th>
            <th className="px-5 py-4 font-medium">Plate Number</th>
            <th className="px-5 py-4 font-medium">Capacity</th>
            <th className="px-5 py-4 font-medium">GPS Assignment</th>
            <th className="px-5 py-4 font-medium">Operational Status</th>
            <th className="px-5 py-4 font-medium">Bus Status</th>
            <th className="px-5 py-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {buses.map((bus) => {
            const gps = bus.activeGpsDeviceAssignment?.gpsDevice ?? null;

            return (
              <tr
                key={bus.id}
                className="border-b border-slate-800 last:border-b-0"
              >
                <td className="px-5 py-4 align-top">
                  <div className="font-medium text-slate-100">{bus.busCode}</div>
                  <div className="mt-1 text-xs text-slate-500">{bus.id}</div>
                </td>

                <td className="px-5 py-4 align-top text-slate-400">
                  {bus.plateNumber?.trim() ? bus.plateNumber : "—"}
                </td>

                <td className="px-5 py-4 align-top text-slate-400">
                  {bus.capacity ?? "—"}
                </td>

                <td className="px-5 py-4 align-top">
                  {gps ? (
                    <div className="space-y-1">
                      <div className="font-medium text-slate-100">
                        {gps.deviceCode}
                      </div>
                      <div className="text-xs text-slate-500">
                        {gps.displayName || "No display name"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Assigned: {formatDateTime(bus.activeGpsDeviceAssignment?.assignedAt)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone={gps.traccarManaged ? "info" : "neutral"}>
                          {gps.traccarManaged ? "Traccar managed" : "Direct ingest"}
                        </Badge>
                        <Badge tone={traccarTone(gps.traccarSyncStatus)}>
                          {gps.traccarSyncStatus}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">No active GPS device</span>
                  )}
                </td>

                <td className="px-5 py-4 align-top">
                  {gps ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={gpsTone(gps.lastStatus)}>
                          {gps.lastStatus ?? "UNKNOWN"}
                        </Badge>
                        <Badge tone={gps.isActive ? "success" : "warning"}>
                          {gps.isActive ? "Tracker active" : "Tracker inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        Last seen: {formatDateTime(gps.lastSeenAt)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Unique ID: {gps.traccarUniqueId ?? "—"}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Badge tone="warning">Not tracking-ready</Badge>
                      <div className="text-xs text-slate-500">
                        Assign a GPS device to make this bus hardware-ready.
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-5 py-4 align-top">
                  <Badge tone={bus.isActive ? "success" : "warning"}>
                    {bus.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>

                <td className="px-5 py-4 text-right align-top">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onEdit(bus)}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onAssignGps(bus)}
                    >
                      {gps ? "Reassign GPS" : "Assign GPS"}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!gps}
                      onClick={() => onUnassignGps(bus)}
                    >
                      Unassign GPS
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDelete(bus)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </AdminTableShell>
  );
}