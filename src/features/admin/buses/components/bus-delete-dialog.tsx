"use client";

import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import type { AdminBusItem } from "../api/admin.buses.api";

export function BusDeleteDialog({
  bus,
  submitting = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  bus: AdminBusItem;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <AdminConfirmModal
      tone="danger"
      title="Delete bus"
      description={`You are about to delete ${bus.busCode}.`}
      warning="This action should only succeed when the bus is not referenced by trips, service schedules, or related operational events."
      details={[
        { label: "Bus code", value: bus.busCode },
        { label: "Plate number", value: bus.plateNumber },
        { label: "Capacity", value: bus.capacity },
        { label: "Status", value: bus.isActive ? "Active" : "Inactive" },
      ]}
      confirmLabel="Delete bus"
      submitting={submitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}