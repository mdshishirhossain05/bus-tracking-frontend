"use client";

import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import type { AdminUserItem } from "../api/admin.users.api";

export function UserStatusModal({
  user,
  submitting = false,
  errorMessage,
  onSubmit,
  onClose,
}: {
  user: AdminUserItem;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (isActive: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const nextIsActive = !user.isActive;

  return (
    <AdminConfirmModal
      tone={nextIsActive ? "info" : "danger"}
      title={nextIsActive ? "Activate user" : "Deactivate user"}
      description={`You are about to ${
        nextIsActive ? "activate" : "deactivate"
      } ${user.fullName}.`}
      warning={
        nextIsActive
          ? "This user will regain access to the system."
          : "This user will immediately lose access and active sessions may be revoked."
      }
      details={[
        { label: "Name", value: user.fullName },
        { label: "Email", value: user.email },
        { label: "Role", value: user.role },
        { label: "Current status", value: user.isActive ? "Active" : "Inactive" },
      ]}
      confirmLabel={nextIsActive ? "Activate user" : "Deactivate user"}
      submitting={submitting}
      errorMessage={errorMessage}
      onConfirm={() => onSubmit(nextIsActive)}
      onClose={onClose}
    />
  );
}