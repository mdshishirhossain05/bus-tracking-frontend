"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminUserItem } from "../api/admin.users.api";
import { AdminTableShell } from "../../shared/components/admin-table-shell";

export function UsersTable({
  users,
  onEdit,
  onSessions,
  onRoleChange,
  onStatusChange,
  onApprovePassenger,
  onRejectPassenger,
  onDeleteUser,
}: {
  users: AdminUserItem[];
  onEdit: (u: AdminUserItem) => void;
  onSessions: (u: AdminUserItem) => void;
  onRoleChange: (u: AdminUserItem) => void;
  onStatusChange: (u: AdminUserItem) => void;
  onApprovePassenger: (u: AdminUserItem) => void;
  onRejectPassenger: (u: AdminUserItem) => void;
  onDeleteUser: (u: AdminUserItem) => void;
}) {
  return (
    <AdminTableShell>
      <table className="w-full min-w-[1420px] text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="px-4 py-4 sm:px-5">User</th>
            <th className="px-4 py-4 sm:px-5">Role</th>
            <th className="px-4 py-4 sm:px-5">Student ID</th>
            <th className="px-4 py-4 sm:px-5">Source</th>
            <th className="px-4 py-4 sm:px-5">Approval</th>
            <th className="px-4 py-4 sm:px-5">Sessions</th>
            <th className="px-4 py-4 sm:px-5">Trips</th>
            <th className="px-4 py-4 sm:px-5">Status</th>
            <th className="px-4 py-4 text-right sm:px-5">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => {
            const canApprove =
              u.role === "PASSENGER" && u.approvalStatus === "PENDING_APPROVAL";
            const canReject =
              u.role === "PASSENGER" && u.approvalStatus !== "REJECTED";

            return (
              <tr key={u.id} className="border-b border-slate-800 last:border-b-0">
                <td className="px-4 py-4 sm:px-5">
                  <div className="font-medium text-slate-100">{u.fullName}</div>
                  <div className="mt-1 break-all text-xs text-slate-500">
                    {u.email}
                  </div>
                  {u.phoneNumber ? (
                    <div className="mt-1 text-xs text-slate-500">{u.phoneNumber}</div>
                  ) : null}
                </td>

                <td className="px-4 py-4 sm:px-5">
                  <Badge tone="neutral">{u.role}</Badge>
                </td>

                <td className="px-4 py-4 sm:px-5">{u.studentId ?? "—"}</td>

                <td className="px-4 py-4 sm:px-5">
                  <Badge tone={u.registrationSource === "SELF" ? "info" : "neutral"}>
                    {u.registrationSource}
                  </Badge>
                </td>

                <td className="px-4 py-4 sm:px-5">
                  <Badge
                    tone={
                      u.approvalStatus === "APPROVED"
                        ? "success"
                        : u.approvalStatus === "PENDING_APPROVAL"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {u.approvalStatus}
                  </Badge>
                </td>

                <td className="px-4 py-4 sm:px-5">{u.sessionCount}</td>
                <td className="px-4 py-4 sm:px-5">{u.drivenTripCount}</td>

                <td className="px-4 py-4 sm:px-5">
                  <Badge tone={u.isActive ? "success" : "warning"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>

                <td className="px-4 py-4 text-right sm:px-5">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(u)}>
                      Edit
                    </Button>

                    <Button size="sm" variant="secondary" onClick={() => onSessions(u)}>
                      Sessions
                    </Button>

                    <Button size="sm" variant="secondary" onClick={() => onRoleChange(u)}>
                      Role
                    </Button>

                    <Button size="sm" variant="secondary" onClick={() => onStatusChange(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </Button>

                    <Button size="sm" onClick={() => onApprovePassenger(u)} disabled={!canApprove}>
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRejectPassenger(u)}
                      disabled={!canReject}
                    >
                      Reject
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDeleteUser(u)}
                      disabled={!u.canDelete}
                      title={u.canDelete ? "Delete user" : u.deleteBlockedReason ?? "Delete not allowed"}
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