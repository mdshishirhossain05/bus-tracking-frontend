"use client";

import { useMemo, useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  handleApiError,
  handleCreateSuccess,
  handleDeleteSuccess,
  handleUpdateSuccess,
} from "@/lib/utils/toast";
import { useToast } from "@/providers/toast-provider";
import { AdminFilterBar } from "../shared/components/admin-filter-bar";
import { AdminPaginationBar } from "../shared/components/admin-pagination-bar";
import { AdminListStats } from "../shared/components/admin-list-stats";
import { useAdminGpsDevices } from "./hooks/use-admin-gps-devices";
import type {
  AdminBusOption,
  AdminGpsDeviceFormValues,
  AdminGpsDeviceItem,
  AdminTrackingMode,
} from "./types";

type ModalState =
  | { type: "create" }
  | { type: "edit"; gpsDevice: AdminGpsDeviceItem }
  | { type: "delete"; gpsDevice: AdminGpsDeviceItem }
  | { type: "assign"; gpsDevice: AdminGpsDeviceItem }
  | { type: "unassign"; gpsDevice: AdminGpsDeviceItem }
  | null;

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toneForStatus(status?: string | null) {
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

function toneForTraccarSync(status?: string | null) {
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

function resolveUniqueIdPreview(values: {
  imei: string;
  serialNumber: string;
  deviceCode: string;
  traccarUniqueId: string;
}) {
  return (
    values.traccarUniqueId.trim() ||
    values.imei.trim() ||
    values.serialNumber.trim() ||
    values.deviceCode.trim() ||
    "—"
  );
}

function GpsDeviceFormModal({
  initial,
  submitting = false,
  generatedApiKey = null,
  onSubmit,
  onClose,
}: {
  initial?: AdminGpsDeviceItem | null;
  submitting?: boolean;
  generatedApiKey?: string | null;
  onSubmit: (
    values: AdminGpsDeviceFormValues & {
      apiKey?: string | null;
      rotateApiKey?: boolean;
    },
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [trackingMode, setTrackingMode] = useState<AdminTrackingMode>(
    initial?.traccarManaged ? "TRACCAR" : "DIRECT",
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [values, setValues] = useState({
    deviceCode: initial?.deviceCode ?? "",
    serialNumber: initial?.serialNumber ?? "",
    displayName: initial?.displayName ?? "",
    vendorName: initial?.vendorName ?? "",
    modelName: initial?.modelName ?? "",
    imei: initial?.imei ?? "",
    notes: initial?.notes ?? "",
    isActive: initial?.isActive ?? true,
    apiKey: "",
    rotateApiKey: false,
    traccarDeviceId: initial?.traccarDeviceId?.toString() ?? "",
    traccarUniqueId: initial?.traccarUniqueId ?? "",
    traccarServerBaseUrl: initial?.traccarServerBaseUrl ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const title = initial ? "Edit GPS Device" : "Create GPS Device";
  const resolvedUniqueId = resolveUniqueIdPreview(values);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!values.deviceCode.trim()) {
      nextErrors.deviceCode = "Device code is required.";
    }

    if (!values.displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!values.vendorName.trim()) {
      nextErrors.vendorName = "Vendor is required.";
    }

    if (!values.modelName.trim()) {
      nextErrors.modelName = "Model is required.";
    }

    if (!values.imei.trim() && !values.serialNumber.trim()) {
      nextErrors.identifier =
        "At least one hardware identifier is required: IMEI or Serial number.";
    }

    if (
      values.traccarDeviceId.trim() &&
      Number.isNaN(Number(values.traccarDeviceId.trim()))
    ) {
      nextErrors.traccarDeviceId = "Traccar device ID must be numeric.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const traccarManaged = trackingMode === "TRACCAR";

    await onSubmit({
      deviceCode: values.deviceCode.trim(),
      serialNumber: values.serialNumber.trim() || null,
      displayName: values.displayName.trim() || null,
      vendorName: values.vendorName.trim() || null,
      modelName: values.modelName.trim() || null,
      imei: values.imei.trim() || null,
      notes: values.notes.trim() || null,
      isActive: values.isActive,
      apiKey:
        !initial && trackingMode === "DIRECT"
          ? values.apiKey.trim() || null
          : undefined,
      rotateApiKey:
        initial && trackingMode === "DIRECT" ? values.rotateApiKey : undefined,
      traccarManaged,
      traccarDeviceId:
        traccarManaged && showAdvanced && values.traccarDeviceId.trim()
          ? Number(values.traccarDeviceId.trim())
          : null,
      traccarUniqueId:
        traccarManaged && showAdvanced
          ? values.traccarUniqueId.trim() || null
          : null,
      traccarServerBaseUrl:
        traccarManaged && showAdvanced
          ? values.traccarServerBaseUrl.trim() || null
          : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-3xl rounded-sm">
        <CardContent className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Enterprise-grade GPS device onboarding for live bus tracking.
            </p>
          </div>

          {generatedApiKey ? (
            <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-300">
                Save this generated API key now
              </p>
              <p className="mt-1 break-all rounded-sm bg-slate-900 px-3 py-2 text-sm text-slate-100">
                {generatedApiKey}
              </p>
              <p className="mt-2 text-xs text-amber-300">
                It may not be shown again by the backend.
              </p>
            </div>
          ) : null}

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Tracking mode
            </label>
            <Select
              value={trackingMode}
              onChange={(e) =>
                setTrackingMode(e.target.value as AdminTrackingMode)
              }
            >
              <option value="TRACCAR">Traccar-managed</option>
              <option value="DIRECT">Direct ingest</option>
            </Select>
            <p className="mt-2 text-xs text-slate-500">
              Traccar-managed is recommended for real hardware integration.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Device code *
              </label>
              <Input
                placeholder="e.g. GPS-BUS-001"
                value={values.deviceCode}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, deviceCode: e.target.value }))
                }
              />
              {errors.deviceCode ? (
                <p className="text-xs text-red-400">{errors.deviceCode}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Display name *
              </label>
              <Input
                placeholder="e.g. Main Campus Bus Tracker 01"
                value={values.displayName}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, displayName: e.target.value }))
                }
              />
              {errors.displayName ? (
                <p className="text-xs text-red-400">{errors.displayName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Vendor *
              </label>
              <Input
                placeholder="e.g. Teltonika"
                value={values.vendorName}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, vendorName: e.target.value }))
                }
              />
              {errors.vendorName ? (
                <p className="text-xs text-red-400">{errors.vendorName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Model *
              </label>
              <Input
                placeholder="e.g. FMB920"
                value={values.modelName}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, modelName: e.target.value }))
                }
              />
              {errors.modelName ? (
                <p className="text-xs text-red-400">{errors.modelName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">IMEI</label>
              <Input
                placeholder="Hardware IMEI"
                value={values.imei}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, imei: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Serial number
              </label>
              <Input
                placeholder="Hardware serial number"
                value={values.serialNumber}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, serialNumber: e.target.value }))
                }
              />
            </div>
          </div>

          {errors.identifier ? (
            <p className="text-xs text-red-400">{errors.identifier}</p>
          ) : null}

          <div className="rounded-sm border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-sm font-medium text-blue-300">
              Resolved Traccar unique ID
            </p>
            <p className="mt-1 text-sm text-slate-100">{resolvedUniqueId}</p>
            <p className="mt-2 text-xs text-blue-300">
              Automatically resolved from custom override → IMEI → Serial number → Device code.
            </p>
          </div>

          {trackingMode === "DIRECT" && !initial ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Custom API key (optional)
              </label>
              <Input
                placeholder="Leave empty to let backend generate one"
                value={values.apiKey}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, apiKey: e.target.value }))
                }
              />
            </div>
          ) : null}

          {trackingMode === "DIRECT" && initial ? (
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={values.rotateApiKey}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      rotateApiKey: e.target.checked,
                    }))
                  }
                />
                Rotate API key
              </label>
              <p className="mt-2 text-xs text-slate-500">
                Enable only when you want the backend to generate a fresh device key.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Notes</label>
            <Input
              placeholder="Optional operational note"
              value={values.notes}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <Select
              value={values.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  isActive: e.target.value === "active",
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          {trackingMode === "TRACCAR" ? (
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
              <button
                type="button"
                className="text-sm font-medium text-slate-200"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                {showAdvanced ? "Hide advanced settings" : "Show advanced settings"}
              </button>

              {showAdvanced ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Traccar device ID
                    </label>
                    <Input
                      placeholder="Normally leave empty"
                      value={values.traccarDeviceId}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          traccarDeviceId: e.target.value,
                        }))
                      }
                    />
                    {errors.traccarDeviceId ? (
                      <p className="text-xs text-red-400">
                        {errors.traccarDeviceId}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Unique ID override
                    </label>
                    <Input
                      placeholder="Optional override"
                      value={values.traccarUniqueId}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          traccarUniqueId: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">
                      Traccar server base URL override
                    </label>
                    <Input
                      placeholder="Optional override, usually leave empty"
                      value={values.traccarServerBaseUrl}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          traccarServerBaseUrl: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting
                ? "Saving..."
                : initial
                  ? "Save changes"
                  : "Create device"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssignGpsDeviceModal({
  gpsDevice,
  busOptions,
  submitting = false,
  onSubmit,
  onClose,
}: {
  gpsDevice: AdminGpsDeviceItem;
  busOptions: AdminBusOption[];
  submitting?: boolean;
  onSubmit: (values: { busId: string; notes: string | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [busId, setBusId] = useState(gpsDevice.activeAssignment?.bus?.id ?? "");
  const [notes, setNotes] = useState(gpsDevice.activeAssignment?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!busId) {
      setError("Please select a bus.");
      return;
    }

    setError(null);
    await onSubmit({
      busId,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl rounded-sm">
        <CardContent className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              Assign GPS Device
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Assign <span className="font-medium">{gpsDevice.deviceCode}</span> to an active bus.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Bus</label>
            <Select value={busId} onChange={(e) => setBusId(e.target.value)}>
              <option value="">Select a bus</option>
              {busOptions.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.busCode}
                  {bus.plateNumber ? ` — ${bus.plateNumber}` : ""}
                  {!bus.isActive ? " (Inactive)" : ""}
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
              {submitting ? "Assigning..." : "Assign device"}
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

export function AdminGpsDevicesPage() {
  const {
    gpsDevices,
    allGpsDevices,
    busOptions,
    filteredCount,
    loading,
    meta,
    query,
    reload,
    setSearch,
    setIsActive,
    setAssignment,
    setPage,
    setLimit,
    resetFilters,
    activeCount,
    assignedCount,
    createGpsDevice,
    updateGpsDevice,
    deleteGpsDevice,
    assignGpsDeviceToBus,
    unassignGpsDeviceFromBus,
    reconcileTraccarGpsDevice,
    removeGpsDeviceLocally,
    upsertGpsDeviceLocally,
  } = useAdminGpsDevices();

  const toast = useToast();

  const [searchInput, setSearchInput] = useState(query.search);
  const [statusInput, setStatusInput] = useState<"ALL" | "true" | "false">(
    query.isActive,
  );
  const [assignmentInput, setAssignmentInput] = useState<
    "ALL" | "assigned" | "unassigned"
  >(query.assignment);
  const [modal, setModal] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [latestGeneratedApiKey, setLatestGeneratedApiKey] = useState<string | null>(
    null,
  );

  function closeModal() {
    setModal(null);
    setSubmitting(false);
    setLatestGeneratedApiKey(null);
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
      setAssignment(assignmentInput);
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
      setAssignmentInput("ALL");
      resetFilters();
    } finally {
      setApplyingFilters(false);
    }
  }

  async function handleCreate(
    values: AdminGpsDeviceFormValues & {
      apiKey?: string | null;
      rotateApiKey?: boolean;
    },
  ) {
    try {
      setSubmitting(true);
      const result = await createGpsDevice(values);

      setLatestGeneratedApiKey(result.generatedApiKey ?? null);

      if (result.gpsDevice) {
        upsertGpsDeviceLocally(result.gpsDevice);
      }

      handleCreateSuccess(toast, "GPS device");

      if (!result.generatedApiKey) {
        closeModal();
      }
    } catch (error) {
      handleApiError(toast, error, "create", "GPS device");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(
    values: AdminGpsDeviceFormValues & {
      apiKey?: string | null;
      rotateApiKey?: boolean;
    },
  ) {
    if (!modal || modal.type !== "edit") return;

    try {
      setSubmitting(true);
      const result = await updateGpsDevice(modal.gpsDevice.id, values);

      setLatestGeneratedApiKey(result.generatedApiKey ?? null);

      if (result.gpsDevice) {
        upsertGpsDeviceLocally(result.gpsDevice);
      }

      handleUpdateSuccess(toast, "GPS device");

      if (!result.generatedApiKey) {
        closeModal();
      }
    } catch (error) {
      handleApiError(toast, error, "update", "GPS device");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!modal || modal.type !== "delete") return;

    const deletingId = modal.gpsDevice.id;

    try {
      setSubmitting(true);
      await deleteGpsDevice(deletingId);
      removeGpsDeviceLocally(deletingId);
      handleDeleteSuccess(toast, "GPS device");
      closeModal();
    } catch (error) {
      handleApiError(toast, error, "delete", "GPS device");
      setSubmitting(false);
    }
  }

  async function handleAssign(values: { busId: string; notes: string | null }) {
    if (!modal || modal.type !== "assign") return;

    try {
      setSubmitting(true);
      await assignGpsDeviceToBus({
        busId: values.busId,
        gpsDeviceId: modal.gpsDevice.id,
        notes: values.notes,
      });
      handleUpdateSuccess(toast, "GPS assignment");
      closeModal();
      await handleReload();
    } catch (error) {
      const message = getApiErrorMessage(error);
      handleApiError(toast, error, "update", "GPS device");
      console.error(message);
      setSubmitting(false);
    }
  }

  async function handleUnassignConfirm() {
    if (!modal || modal.type !== "unassign") return;

    const assignedBusId = modal.gpsDevice.activeAssignment?.bus?.id;
    if (!assignedBusId) return;

    try {
      setSubmitting(true);
      await unassignGpsDeviceFromBus(assignedBusId);
      handleUpdateSuccess(toast, "GPS unassignment");
      closeModal();
      await handleReload();
    } catch (error) {
      handleApiError(toast, error, "update", "GPS device");
      setSubmitting(false);
    }
  }

  async function handleReconcileTraccar(device: AdminGpsDeviceItem) {
    try {
      setSubmitting(true);
      const result = await reconcileTraccarGpsDevice(device.id);

      if (result.gpsDevice) {
        upsertGpsDeviceLocally(result.gpsDevice);
      }

      handleUpdateSuccess(toast, "Traccar device sync");
    } catch (error) {
      handleApiError(toast, error, "update", "Traccar linkage");
    } finally {
      setSubmitting(false);
    }
  }

  const activeBusOptions = useMemo(
    () => busOptions.filter((item) => item.isActive),
    [busOptions],
  );

  if (loading) {
    return <SectionSkeleton />;
  }

  if (loadFailed) {
    return (
      <ErrorState
        description="Failed to load GPS devices."
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="Fixed GPS devices"
        description="Manage hardware GPS devices, live assignment, and Traccar integration from one enterprise control panel."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button onClick={() => setModal({ type: "create" })}>
              Create GPS device
            </Button>
          </div>
        }
      >
        <AdminListStats
          items={[
            { label: "Total devices", value: allGpsDevices.length },
            { label: "Active devices", value: activeCount },
            { label: "Assigned devices", value: assignedCount },
            { label: "Filtered results", value: filteredCount },
          ]}
        />

        <AdminFilterBar
          onApply={() => void handleApplyFilters()}
          onReset={() => void handleResetFilters()}
          applying={applyingFilters}
        >
          <Input
            placeholder="Search by code, name, serial, IMEI, vendor, model, Traccar unique ID, or bus"
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
            value={assignmentInput}
            onChange={(e) =>
              setAssignmentInput(
                e.target.value as "ALL" | "assigned" | "unassigned",
              )
            }
          >
            <option value="ALL">All assignment states</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
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

        {gpsDevices.length === 0 ? (
          <EmptyState
            title={
              allGpsDevices.length === 0
                ? "No GPS devices yet"
                : "No GPS devices match the current filters"
            }
            description={
              allGpsDevices.length === 0
                ? "Create the first production GPS device to begin real fleet tracking."
                : "Try changing your filters or search terms."
            }
            actionLabel={allGpsDevices.length === 0 ? "Create GPS device" : undefined}
            onAction={
              allGpsDevices.length === 0
                ? () => setModal({ type: "create" })
                : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-sm border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500">
                    <th className="px-5 py-4 font-medium">Device</th>
                    <th className="px-5 py-4 font-medium">Hardware</th>
                    <th className="px-5 py-4 font-medium">Telemetry</th>
                    <th className="px-5 py-4 font-medium">Assignment</th>
                    <th className="px-5 py-4 font-medium">Integration</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gpsDevices.map((device) => (
                    <tr
                      key={device.id}
                      className="border-b border-slate-800 last:border-b-0"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-slate-100">
                          {device.deviceCode}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {device.displayName || "No display name"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {device.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-slate-400">
                        <div>{device.vendorName || "—"}</div>
                        <div className="mt-1">{device.modelName || "—"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Serial: {device.serialNumber || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          IMEI: {device.imei || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-slate-400">
                        <div className="text-xs text-slate-500">Last seen</div>
                        <div>{formatDateTime(device.lastSeenAt)}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Last packet
                        </div>
                        <div>{formatDateTime(device.lastRecordedAt)}</div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        {device.activeAssignment?.bus ? (
                          <div className="space-y-1">
                            <div className="font-medium text-slate-100">
                              {device.activeAssignment.bus.busCode}
                            </div>
                            <div className="text-xs text-slate-500">
                              {device.activeAssignment.bus.plateNumber || "No plate"}
                            </div>
                            <div className="text-xs text-slate-500">
                              Assigned: {formatDateTime(device.activeAssignment.assignedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={device.traccarManaged ? "info" : "neutral"}>
                              {device.traccarManaged ? "Traccar managed" : "Direct ingest"}
                            </Badge>
                            <Badge tone={toneForTraccarSync(device.traccarSyncStatus)}>
                              {device.traccarSyncStatus}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-500">
                            Device ID: {device.traccarDeviceId ?? "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Unique ID: {device.traccarUniqueId ?? "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Last sync: {formatDateTime(device.traccarLastSyncAt)}
                          </div>
                          {device.traccarLastError ? (
                            <div className="text-xs text-red-400">
                              {device.traccarLastError}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={device.isActive ? "success" : "warning"}>
                            {device.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge tone={toneForStatus(device.lastStatus)}>
                            {device.lastStatus ?? "UNKNOWN"}
                          </Badge>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setModal({ type: "edit", gpsDevice: device })}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!device.traccarManaged || submitting}
                            onClick={() => void handleReconcileTraccar(device)}
                          >
                            Sync Traccar
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setModal({ type: "assign", gpsDevice: device })}
                          >
                            {device.activeAssignment ? "Reassign" : "Assign"}
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!device.activeAssignment?.bus?.id}
                            onClick={() => setModal({ type: "unassign", gpsDevice: device })}
                          >
                            Unassign
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setModal({ type: "delete", gpsDevice: device })}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
        <GpsDeviceFormModal
          submitting={submitting}
          generatedApiKey={latestGeneratedApiKey}
          onSubmit={handleCreate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <GpsDeviceFormModal
          initial={modal.gpsDevice}
          submitting={submitting}
          generatedApiKey={latestGeneratedApiKey}
          onSubmit={handleUpdate}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "assign" ? (
        <AssignGpsDeviceModal
          gpsDevice={modal.gpsDevice}
          busOptions={activeBusOptions}
          submitting={submitting}
          onSubmit={handleAssign}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "unassign" ? (
        <ConfirmDialog
          title="Unassign GPS Device"
          description={`Unassign ${modal.gpsDevice.deviceCode} from ${
            modal.gpsDevice.activeAssignment?.bus?.busCode ?? "the current bus"
          }?`}
          confirmLabel="Unassign device"
          confirmTone="warning"
          submitting={submitting}
          onConfirm={handleUnassignConfirm}
          onClose={closeModal}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <ConfirmDialog
          title="Delete GPS Device"
          description={`Delete ${modal.gpsDevice.deviceCode}? Use this only when the device should be removed from the system.`}
          confirmLabel="Delete device"
          confirmTone="danger"
          submitting={submitting}
          onConfirm={handleDeleteConfirm}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}