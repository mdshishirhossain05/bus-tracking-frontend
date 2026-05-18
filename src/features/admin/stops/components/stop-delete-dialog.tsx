"use client";

import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import type { StopItem } from "../api/admin.stops.api";

export function StopDeleteDialog({
  stop,
  submitting = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  stop: StopItem;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <AdminConfirmModal
      tone="danger"
      title="Delete stop"
      description={`You are about to delete ${stop.stopName}.`}
      warning="This action should only succeed when the stop is not referenced by routes, schedules, or arrival records."
      details={[
        { label: "Stop name", value: stop.stopName },
        { label: "Stop code", value: stop.stopCode || "—" },
        { label: "Status", value: stop.isActive ? "Active" : "Inactive" },
        { label: "Latitude", value: stop.lat },
        { label: "Longitude", value: stop.lng },
        { label: "Routes", value: stop.usageSummary?.routeStops ?? 0 },
        { label: "Schedules", value: stop.usageSummary?.schedules ?? 0 },
        { label: "Arrivals", value: stop.usageSummary?.stopArrivals ?? 0 },
      ]}
      confirmLabel="Delete stop"
      submitting={submitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}