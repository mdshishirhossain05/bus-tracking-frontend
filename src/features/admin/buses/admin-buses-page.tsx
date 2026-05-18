"use client";

import { useEffect, useMemo, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage, getApiStatusCode } from "@/lib/api/error";
import { messages } from "@/lib/constants/messages";
import {
  handleApiError,
  handleConflict,
  handleCreateSuccess,
  handleDeleteSuccess,
  handleUpdateSuccess,
} from "@/lib/utils/toast";
import { useToast } from "@/providers/toast-provider";
import type { AdminBusItem } from "./api/admin.buses.api";
import { BusDeleteDialog } from "./components/bus-delete-dialog";
import { BusFormModal } from "./components/bus-form-modal";
import { BusesTable } from "./components/buses-table";
import { useAdminBuses } from "./hooks/use-admin-buses";
import { AdminFilterBar } from "../shared/components/admin-filter-bar";
import { AdminPaginationBar } from "../shared/components/admin-pagination-bar";
import { AdminListStats } from "../shared/components/admin-list-stats";

type ModalState =
  | { type: "create" }
  | { type: "edit"; bus: AdminBusItem }
  | { type: "delete"; bus: AdminBusItem }
  | { type: "assignGps"; bus: AdminBusItem }
  | { type: "unassignGps"; bus: AdminBusItem }
  | null;

function AssignGpsModal({
  bus,
  options,
  submitting = false,
  onSubmit,
  onClose,
}: {
  bus: AdminBusItem;
  options: Array<{
    id: string;
    deviceCode: string;
    displayName: string | null;
    traccarManaged: boolean;
    traccarSyncStatus: string;
    traccarUniqueId: string | null;
  }>;
  submitting?: boolean;
  onSubmit: (values: { gpsDeviceId: string; notes: string | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [gpsDeviceId, setGpsDeviceId] = useState(
    bus.activeGpsDeviceAssignment?.gpsDevice.id ?? "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!gpsDeviceId) {
      setError("Please select a GPS device.");
      return;
    }

    setError(null);
    await onSubmit({
      gpsDeviceId,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl rounded-sm">
        <CardContent className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {bus.activeGpsDeviceAssignment ? "Reassign GPS Device" : "Assign GPS Device"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Connect a hardware GPS tracker to{" "}
              <span className="font-medium">{bus.busCode}</span>.
            </p>
          </div>

          {bus.activeGpsDeviceAssignment ? (
            <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-300">
                Current assignment
              </p>
              <p className="mt-1 text-sm text-slate-100">
                {bus.activeGpsDeviceAssignment.gpsDevice.deviceCode}
                {bus.activeGpsDeviceAssignment.gpsDevice.displayName
                  ? ` — ${bus.activeGpsDeviceAssignment.gpsDevice.displayName}`
                  : ""}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              GPS device
            </label>
            <Select
              value={gpsDeviceId}
              onChange={(e) => setGpsDeviceId(e.target.value)}
            >
              <option value="">Select a GPS device</option>
              {options.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.deviceCode}
                  {device.displayName ? ` — ${device.displayName}` : ""}
                  {device.traccarUniqueId ? ` — ${device.traccarUniqueId}` : ""}
                  {device.traccarManaged ? ` — ${device.traccarSyncStatus}` : ""}
                </option>
              ))}
            </Select>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Notes</label>
            <Input
              placeholder="Optional assignment note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting
                ? "Saving..."
                : bus.activeGpsDeviceAssignment
                  ? "Reassign GPS"
                  : "Assign GPS"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmTone = "danger",
  submitting = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "danger" | "primary" | "warning";
  submitting?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg rounded-sm">
        <CardContent className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={confirmTone === "danger" ? "danger" : "secondary"}
              onClick={() => void onConfirm()}
              disabled={submitting}
            >
              {submitting ? "Working..." : confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminBusesPage() {
  const {
    buses,
    allBuses,
    gpsDevices,
    assignableGpsDevices,
    filteredCount,
    loading,
    meta,
    query,
    reload,
    setSearch,
    setIsActive,
    setPage,
    setLimit,
    resetFilters,
    activeCount,
    assignedGpsCount,
    createBus,
    updateBus,
    deleteBus,
    assignGpsDeviceToBus,
    unassignGpsDeviceFromBus,
  } = useAdminBuses();

  const toast = useToast();

  const [searchInput, setSearchInput] = useState(query.search);
  const [statusInput, setStatusInput] = useState<"ALL" | "true" | "false">(
    query.isActive,
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);

  useEffect(() => {
    setSearchInput(query.search);
    setStatusInput(query.isActive);
  }, [query.search, query.isActive]);

  function closeModal() {
    setModal(null);
    setModalError(null);
    setSubmitting(false);
  }

  async function handleReload() {
    try {
      setLoadFailed(false);
      await reload();
    } catch {
      setLoadFailed(true);
    }
  }

  async function handleApplyFilters() {
    try {
      setApplyingFilters(true);
      setLoadFailed(false);
      setSearch(searchInput);
      setIsActive(statusInput);
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleResetFilters() {
    try {
      setApplyingFilters(true);
      setLoadFailed(false);
      setSearchInput("");
      setStatusInput("ALL");
      resetFilters();
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleCreate(values: {
    busCode: string;
    plateNumber: string | null;
    capacity: number | null;
    isActive: boolean;
  }) {
    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await createBus(values);

      setSearchInput("");
      setStatusInput("ALL");

      handleCreateSuccess(toast, "Bus");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "create", "Bus");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: {
    busCode: string;
    plateNumber: string | null;
    capacity: number | null;
    isActive: boolean;
  }) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await updateBus(modal.bus.id, values);

      handleUpdateSuccess(toast, "Bus");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "update", "Bus");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!modal || modal.type !== "delete") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await deleteBus(modal.bus.id);

      handleDeleteSuccess(toast, "Bus");
      closeModal();
    } catch (error: any) {
      const status = getApiStatusCode(error);
      const message = getApiErrorMessage(error, "Failed to delete bus.");

      if (status === 409) {
        const dependencies = error?.response?.data?.dependencies;
        const details =
          dependencies && typeof dependencies === "object"
            ? `In use by: ${Object.entries(dependencies)
                .filter(([, value]) => Number(value) > 0)
                .map(([key, value]) => `${key} (${value})`)
                .join(", ")}`
            : message;

        setModalError(details);
        handleConflict(toast, "Bus", details);
      } else {
        setModalError(message);
        handleApiError(toast, error, "delete", "Bus");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignGps(values: {
    gpsDeviceId: string;
    notes: string | null;
  }) {
    if (!modal || modal.type !== "assignGps") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await assignGpsDeviceToBus({
        busId: modal.bus.id,
        gpsDeviceId: values.gpsDeviceId,
        notes: values.notes,
      });

      handleUpdateSuccess(toast, "GPS assignment");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "update", "GPS assignment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnassignGpsConfirm() {
    if (!modal || modal.type !== "unassignGps") return;

    try {
      setSubmitting(true);
      setModalError(null);
      setLoadFailed(false);

      await unassignGpsDeviceFromBus(modal.bus.id);

      handleUpdateSuccess(toast, "GPS unassignment");
      closeModal();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setModalError(message);
      handleApiError(toast, error, "update", "GPS assignment");
    } finally {
      setSubmitting(false);
    }
  }

  const gpsOptionsForSelectedBus = useMemo(() => {
    if (!modal || modal.type !== "assignGps") return [];

    const currentAssignedId = modal.bus.activeGpsDeviceAssignment?.gpsDevice.id;

    return gpsDevices
      .filter(
        (device) =>
          device.isActive &&
          (!device.activeAssignment || device.id === currentAssignedId),
      )
      .map((device) => ({
        id: device.id,
        deviceCode: device.deviceCode,
        displayName: device.displayName,
        traccarManaged: device.traccarManaged,
        traccarSyncStatus: device.traccarSyncStatus,
        traccarUniqueId: device.traccarUniqueId,
      }));
  }, [gpsDevices, modal]);

  if (loading) {
    return <SectionSkeleton />;
  }

  if (loadFailed) {
    return (
      <ErrorState
        description={messages.error.load("Buses").description}
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Bus operations registry"
        description="Manage bus inventory together with hardware tracking readiness and active GPS assignment visibility."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button onClick={() => setModal({ type: "create" })}>
              Create bus
            </Button>
          </div>
        }
      >
        <AdminListStats
          items={[
            { label: "Total buses", value: allBuses.length },
            { label: "Active buses", value: activeCount },
            { label: "GPS assigned", value: assignedGpsCount },
            { label: "Available GPS", value: assignableGpsDevices.length },
            { label: "Filtered results", value: filteredCount },
          ]}
        />

        <AdminFilterBar
          onApply={() => void handleApplyFilters()}
          onReset={() => void handleResetFilters()}
          applying={applyingFilters}
        >
          <Input
            placeholder="Search by bus code, plate number, capacity, or GPS device"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleApplyFilters();
              }
            }}
          />

          <Select
            value={statusInput}
            onChange={(e) =>
              setStatusInput(e.target.value as "ALL" | "true" | "false")
            }
          >
            <option value="ALL">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>

          <Select
            value={String(meta.limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </AdminFilterBar>

        {buses.length === 0 ? (
          <EmptyState
            title={
              allBuses.length === 0
                ? messages.empty.noData("Buses").title
                : messages.empty.noResults("Buses").title
            }
            description={
              allBuses.length === 0
                ? "Create the first bus to begin operations and later connect live GPS tracking."
                : messages.empty.noResults("Buses").description
            }
            actionLabel={allBuses.length === 0 ? "Create bus" : undefined}
            onAction={
              allBuses.length === 0
                ? () => setModal({ type: "create" })
                : undefined
            }
          />
        ) : (
          <BusesTable
            buses={buses}
            onEdit={(bus) => setModal({ type: "edit", bus })}
            onDelete={(bus) => setModal({ type: "delete", bus })}
            onAssignGps={(bus) => setModal({ type: "assignGps", bus })}
            onUnassignGps={(bus) => setModal({ type: "unassignGps", bus })}
          />
        )}

        <AdminPaginationBar
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          limit={meta.limit}
          onPageChange={(page) => setPage(page)}
          onLimitChange={(limit) => setLimit(limit)}
        />
      </PageSection>

      {modal?.type === "create" ? (
        <BusFormModal
          submitting={submitting}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <BusFormModal
          initial={modal.bus}
          submitting={submitting}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <BusDeleteDialog
          bus={modal.bus}
          submitting={submitting}
          errorMessage={modalError}
          onConfirm={handleDeleteConfirm}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "assignGps" ? (
        <AssignGpsModal
          bus={modal.bus}
          options={gpsOptionsForSelectedBus}
          submitting={submitting}
          onSubmit={handleAssignGps}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "unassignGps" ? (
        <ConfirmDialog
          title="Unassign GPS Device"
          description={`Unassign the current GPS device from ${modal.bus.busCode}?`}
          confirmLabel="Unassign GPS"
          confirmTone="warning"
          submitting={submitting}
          onConfirm={handleUnassignGpsConfirm}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}