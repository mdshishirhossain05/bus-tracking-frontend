"use client";

import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import type { ServiceScheduleItem } from "../api/admin.service-schedules.api";

export type ServiceScheduleActionType =
  | "archive"
  | "restore"
  | "permanent-delete";

export function ServiceScheduleDeleteDialog({
  schedule,
  actionType,
  submitting = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  schedule: ServiceScheduleItem;
  actionType: ServiceScheduleActionType;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const tone =
    actionType === "restore"
      ? "info"
      : actionType === "archive"
        ? "warning"
        : "danger";

  const title =
    actionType === "archive"
      ? "Archive service schedule"
      : actionType === "restore"
        ? "Restore service schedule"
        : "Permanently delete archived schedule";

  const description =
    actionType === "archive"
      ? `You are about to archive the schedule for ${schedule.routeName}.`
      : actionType === "restore"
        ? `You are about to restore the archived schedule for ${schedule.routeName}.`
        : `You are about to permanently delete the archived schedule for ${schedule.routeName}.`;

  const warning =
    actionType === "archive"
      ? "Archived schedules stay in history, become inactive, and can be restored later."
      : actionType === "restore"
        ? "Restoring will reactivate this schedule if there is no active scheduling conflict."
        : "This permanently removes the archived schedule. Historical trips will be unlinked from this schedule before deletion.";

  const confirmLabel =
    actionType === "archive"
      ? "Archive schedule"
      : actionType === "restore"
        ? "Restore schedule"
        : "Permanently delete";

  return (
    <AdminConfirmModal
      tone={tone}
      title={title}
      description={description}
      warning={warning}
      details={[
        { label: "Route", value: schedule.routeName },
        { label: "Bus", value: schedule.busCode },
        { label: "Driver", value: schedule.driverName },
        { label: "Day type", value: schedule.dayType },
        { label: "Departure", value: schedule.departureTime },
        {
          label: "Status",
          value: schedule.isActive ? "Active" : "Archived",
        },
        {
          label: "Linked trips",
          value: String(schedule.tripCount),
        },
      ]}
      confirmLabel={confirmLabel}
      submitting={submitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}