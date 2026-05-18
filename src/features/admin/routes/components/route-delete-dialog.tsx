"use client";

import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import type { AdminRouteItem } from "../api/admin.routes.api";

export function RouteDeleteDialog({
  route,
  submitting = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  route: AdminRouteItem;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <AdminConfirmModal
      tone="danger"
      title="Delete route"
      description={`You are about to delete ${route.routeName}.`}
      warning="This action should only succeed when the route is not referenced by route stops, trips, timetable schedules, service schedules, or events."
      details={[
        { label: "Route name", value: route.routeName },
        { label: "Description", value: route.description },
        { label: "Status", value: route.isActive ? "Active" : "Inactive" },
      ]}
      confirmLabel="Delete route"
      submitting={submitting}
      errorMessage={errorMessage}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}