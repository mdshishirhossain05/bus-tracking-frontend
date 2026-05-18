"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { AdminUserItem, UserRole } from "../api/admin.users.api";

export function UserRoleModal({
  user,
  submitting = false,
  errorMessage,
  onSubmit,
  onClose,
}: {
  user: AdminUserItem;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (role: UserRole) => Promise<void>;
  onClose: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="w-full max-w-lg rounded-t-3xl sm:rounded-sm">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              Update User Role
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Change the role for <span className="font-medium">{user.fullName}</span>.
            </p>
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-3 rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Role</label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="DRIVER">DRIVER</option>
              <option value="PASSENGER">PASSENGER</option>
            </Select>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            Changing role affects access permissions immediately.
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => void onSubmit(role)}
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update role"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}