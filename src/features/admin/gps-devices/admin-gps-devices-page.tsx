"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { getAdminGpsDeviceTraccarStatus } from "./api/admin-gps-devices.api";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/lib/config/env";
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
  | { type: "diagnose"; gpsDevice: AdminGpsDeviceItem }
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

function formatCoordinate(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  return value.toFixed(6);
}

/**
 * Direct-ingest endpoint a hardware GPS device should POST to. Useful for
 * setup verification so the operator knows exactly which URL to configure
 * on the device side.
 */
function buildIngestUrl(deviceCode: string) {
  const base = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
  return `${base}/gps/devices/${deviceCode}/ingest`;
}

/**
 * Compact, expandable setup hint for a direct-ingest device — shows the
 * exact URL the hardware should POST to, the auth header to send, and a
 * minimal body example. Without this, operators had no in-app way to know
 * which endpoint to configure on the GPS device firmware.
 */
function DirectIngestSetup({ deviceCode }: { deviceCode: string }) {
  const [open, setOpen] = useState(false);
  const url = buildIngestUrl(deviceCode);

  return (
    <div className="space-y-2 text-xs text-slate-500">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-slate-300 hover:text-slate-100"
      >
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        <span>{open ? "Hide setup" : "Show setup URL"}</span>
      </button>

      {open ? (
        <div className="space-y-2 rounded-sm border border-slate-800 bg-slate-950 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              POST
            </p>
            <div className="mt-1 flex items-start justify-between gap-2">
              <code className="break-all rounded bg-slate-900 px-2 py-1 text-[11px] text-slate-100">
                {url}
              </code>
              <CopyButton value={url} label="Copy" />
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Headers
            </p>
            <ul className="mt-1 space-y-1 font-mono text-[11px] text-slate-300">
              <li>x-device-api-key: &lt;device API key&gt;</li>
              <li>Content-Type: application/json</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Body
            </p>
            <pre className="mt-1 overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-200">
{`{
  "lat": 23.780573,
  "lng": 90.279239,
  "speedKmh": 34,
  "heading": 180,
  "accuracyM": 12,
  "recordedAt": "2026-05-20T10:00:00Z"
}`}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Small inline copy-to-clipboard button. Falls back silently when the
 * clipboard API is unavailable (insecure origins, older browsers).
 */
function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Clipboard write blocked — the operator can still select+copy manually.
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-sm"
      onClick={() => void handleCopy()}
      type="button"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
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
        <CardContent className="max-h-[calc(100vh-2rem)] space-y-6 overflow-y-auto p-6">
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
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
                <CopyButton value={generatedApiKey} label="Copy key" />
              </div>
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

/**
 * Surfaces the Traccar + last-packet diagnostics that already exist on the
 * backend, so operators don't have to call them by hand to figure out why a
 * device shows "Never seen". For Direct devices it re-shows the ingest URL
 * with a one-click copy.
 */
function GpsDeviceDiagnoseModal({
  gpsDevice,
  onClose,
}: {
  gpsDevice: AdminGpsDeviceItem;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(gpsDevice.traccarManaged);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [traccarConfigured, setTraccarConfigured] = useState<boolean | null>(
    null,
  );
  const [resolvedUniqueId, setResolvedUniqueId] = useState<string | null>(null);
  const [resolvedServerBaseUrl, setResolvedServerBaseUrl] = useState<
    string | null
  >(null);
  const [remoteDevice, setRemoteDevice] = useState<unknown>(null);
  const [latestPosition, setLatestPosition] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    if (!gpsDevice.traccarManaged) return;

    setLoading(true);
    getAdminGpsDeviceTraccarStatus(gpsDevice.id)
      .then((result) => {
        if (cancelled) return;
        setTraccarConfigured(result.traccarConfigured);
        setResolvedUniqueId(result.resolvedUniqueId ?? null);
        setResolvedServerBaseUrl(result.resolvedServerBaseUrl ?? null);
        setRemoteDevice(result.remoteDevice ?? null);
        setLatestPosition(result.latestPosition ?? null);
        setErrorMessage(result.message ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gpsDevice.id, gpsDevice.traccarManaged]);

  const ingestUrl = buildIngestUrl(gpsDevice.deviceCode);
  const remoteRecord =
    remoteDevice && typeof remoteDevice === "object"
      ? (remoteDevice as Record<string, unknown>)
      : null;
  const remoteStatus =
    typeof remoteRecord?.status === "string" ? remoteRecord.status : null;
  const remoteLastUpdate =
    typeof remoteRecord?.lastUpdate === "string" ? remoteRecord.lastUpdate : null;

  const positionRecord =
    latestPosition && typeof latestPosition === "object"
      ? (latestPosition as Record<string, unknown>)
      : null;
  const positionFixTime =
    typeof positionRecord?.fixTime === "string" ? positionRecord.fixTime : null;

  // Local last packet — set by the backend from Traccar's serverTime, so
  // this is the authoritative "are we receiving fresh positions" signal.
  const localLastRecordedMs = gpsDevice.lastRecordedAt
    ? new Date(gpsDevice.lastRecordedAt).getTime()
    : null;
  const localRecordedAgeSec =
    localLastRecordedMs != null
      ? Math.max(0, (Date.now() - localLastRecordedMs) / 1000)
      : null;
  const localRecordedFresh =
    localRecordedAgeSec != null && localRecordedAgeSec < 5 * 60;

  const fixAgeSec =
    positionFixTime != null
      ? Math.max(0, (Date.now() - new Date(positionFixTime).getTime()) / 1000)
      : null;
  const heartbeatAgeSec =
    remoteLastUpdate != null
      ? Math.max(0, (Date.now() - new Date(remoteLastUpdate).getTime()) / 1000)
      : null;

  // True staleness: heartbeat is fresh but we genuinely haven't seen a
  // recent position locally. Then the GPS chip really isn't reporting.
  const realStaleness =
    heartbeatAgeSec != null &&
    heartbeatAgeSec < 5 * 60 &&
    !localRecordedFresh;

  // Cosmetic firmware quirk: fixTime is old but our local record (set from
  // serverTime) is fresh — tracking works, just don't trust fixTime as a
  // freshness signal. Informational, not alarming.
  const cosmeticFixTimeQuirk =
    localRecordedFresh &&
    fixAgeSec != null &&
    fixAgeSec > 10 * 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-sm">
        <CardContent className="max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-100">
                <Stethoscope className="h-5 w-5 text-blue-300" />
                Diagnose {gpsDevice.deviceCode}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Figure out why this device shows{" "}
                <span className="text-slate-300">
                  {gpsDevice.health === "NEVER_SEEN"
                    ? "Never seen"
                    : gpsDevice.health}
                </span>
                .
              </p>
            </div>
            <Badge tone={gpsDevice.traccarManaged ? "info" : "neutral"}>
              {gpsDevice.traccarManaged ? "Traccar managed" : "Direct ingest"}
            </Badge>
          </div>

          {/* Local backend view of the device. */}
          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm">
            <p className="font-semibold text-slate-100">
              What our backend has seen
            </p>
            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Last packet</p>
                <p className="text-slate-200">
                  {formatDateTime(gpsDevice.lastRecordedAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last seen</p>
                <p className="text-slate-200">
                  {formatDateTime(gpsDevice.lastSeenAt)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Last position</p>
                <p className="font-mono text-slate-200">
                  {formatCoordinate(gpsDevice.lastLat) &&
                  formatCoordinate(gpsDevice.lastLng)
                    ? `${formatCoordinate(gpsDevice.lastLat)}, ${formatCoordinate(gpsDevice.lastLng)}`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="text-slate-200">
                  {gpsDevice.lastStatus ?? "UNKNOWN"}
                </p>
              </div>
            </div>
          </div>

          {gpsDevice.traccarManaged ? (
            <div className="space-y-3 rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm">
              <p className="font-semibold text-slate-100">
                Traccar integration
              </p>

              {loading ? (
                <p className="text-xs text-slate-500">
                  Fetching Traccar status…
                </p>
              ) : (
                <>
                  {traccarConfigured === false ? (
                    <div className="flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        Traccar credentials are not configured on the backend.
                        Set <code>TRACCAR_BASE_URL</code> and the API
                        credentials in the backend <code>.env</code> before
                        Traccar can forward positions to this system.
                      </div>
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <div className="flex items-start gap-2 rounded-sm border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>{errorMessage}</div>
                    </div>
                  ) : null}

                  <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Resolved unique ID</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <code className="break-all rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100">
                          {resolvedUniqueId ?? "—"}
                        </code>
                        {resolvedUniqueId ? (
                          <CopyButton value={resolvedUniqueId} label="" />
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Traccar server</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {resolvedServerBaseUrl ? (
                          <>
                            <code className="break-all rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100">
                              {resolvedServerBaseUrl}
                            </code>
                            <a
                              href={resolvedServerBaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-300 hover:text-slate-100"
                              title="Open Traccar"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Remote Traccar status</p>
                      <p className="text-slate-200">{remoteStatus ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">
                        Remote last update (heartbeat)
                      </p>
                      <p className="text-slate-200">
                        {formatDateTime(remoteLastUpdate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">
                        Last GPS fix (position fixTime)
                      </p>
                      <p className="text-slate-200">
                        {formatDateTime(positionFixTime)}
                      </p>
                    </div>
                  </div>

                  {realStaleness ? (
                    <div className="flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        Hardware is connected to Traccar (heartbeat is fresh),
                        but our backend hasn&apos;t received a new position in
                        over 5 minutes. Common causes: the bus is parked
                        indoors / under cover with no sky view, the GPS
                        antenna is unplugged or damaged, or the device
                        firmware is configured to report positions only on
                        movement. Move the bus outside, check the antenna,
                        or check the device configuration.
                      </div>
                    </div>
                  ) : cosmeticFixTimeQuirk ? (
                    // Tracking IS working — the backend uses Traccar's
                    // serverTime for ingest. Display fixTime is a firmware
                    // quirk: the device reports without a UTC offset, so
                    // Traccar's fixTime ends up hours behind real time.
                    <div className="flex items-start gap-2 rounded-sm border border-slate-700/60 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <div>
                        Tracking is working — our backend received its last
                        position{" "}
                        <strong>
                          {Math.max(1, Math.round((localRecordedAgeSec ?? 0)))}{" "}
                          s ago
                        </strong>
                        . The Traccar &ldquo;Last GPS fix&rdquo; above looks
                        stale because this device&apos;s firmware reports{" "}
                        <code className="rounded bg-slate-900 px-1 py-0.5">
                          fixTime
                        </code>{" "}
                        without a UTC offset; we use Traccar&apos;s{" "}
                        <code className="rounded bg-slate-900 px-1 py-0.5">
                          serverTime
                        </code>{" "}
                        instead, which is correct. Nothing to do.
                      </div>
                    </div>
                  ) : null}

                  {/* Actionable guidance based on what we found. */}
                  {!loading && remoteRecord == null && traccarConfigured ? (
                    <div className="flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        Traccar doesn&apos;t recognise this device yet. Use{" "}
                        <span className="font-semibold">Sync Traccar</span> on
                        the row, or create the device on the Traccar server
                        with unique ID{" "}
                        <code className="rounded bg-slate-900 px-1 py-0.5">
                          {resolvedUniqueId ?? gpsDevice.imei ?? gpsDevice.deviceCode}
                        </code>
                        .
                      </div>
                    </div>
                  ) : null}

                  {!loading &&
                  remoteRecord != null &&
                  !gpsDevice.lastRecordedAt ? (
                    <div className="flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        Traccar knows the device, but no position has been
                        forwarded to this system yet. Check that the Traccar
                        forwarder (computed positions →{" "}
                        <code className="rounded bg-slate-900 px-1 py-0.5">
                          POST /gps/devices/{gpsDevice.deviceCode}/ingest
                        </code>
                        ) is enabled and pointing at this server, and that the
                        hardware is online.
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm">
              <p className="font-semibold text-slate-100">
                Direct ingest endpoint
              </p>
              <p className="text-xs text-slate-500">
                Configure the GPS hardware (or its forwarder) to POST location
                packets here:
              </p>
              <div className="flex items-start justify-between gap-2">
                <code className="break-all rounded bg-slate-900 px-2 py-1 text-xs text-slate-100">
                  {ingestUrl}
                </code>
                <CopyButton value={ingestUrl} label="Copy" />
              </div>
              <p className="text-xs text-slate-500">
                Required header:{" "}
                <code className="rounded bg-slate-900 px-1 py-0.5">
                  x-device-api-key
                </code>
                . If you don&apos;t have the key, edit the device and rotate it
                to receive a fresh one.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose}>
              Close
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
                        {formatCoordinate(device.lastLat) &&
                        formatCoordinate(device.lastLng) ? (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="font-mono">
                              {formatCoordinate(device.lastLat)},{" "}
                              {formatCoordinate(device.lastLng)}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500">
                            No position recorded yet
                          </div>
                        )}
                        {device.lastSpeedKmh != null ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {device.lastSpeedKmh.toFixed(1)} km/h
                            {device.lastHeading != null
                              ? ` • ${device.lastHeading}°`
                              : ""}
                          </div>
                        ) : null}
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
                            {device.traccarManaged ? (
                              <Badge tone={toneForTraccarSync(device.traccarSyncStatus)}>
                                {device.traccarSyncStatus}
                              </Badge>
                            ) : null}
                          </div>

                          {device.traccarManaged ? (
                            <>
                              <div className="text-xs text-slate-500">
                                Device ID: {device.traccarDeviceId ?? "—"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Unique ID: {device.traccarUniqueId ?? "—"}
                              </div>
                              <div className="text-xs text-slate-500">
                                Last sync:{" "}
                                {formatDateTime(device.traccarLastSyncAt)}
                              </div>
                              {device.traccarLastError ? (
                                <div className="text-xs text-red-400">
                                  {device.traccarLastError}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            // Direct-ingest devices need the operator to
                            // configure the hardware with this exact URL +
                            // API key. Surfacing it inline (rather than
                            // hiding it in docs) is the most common operator
                            // ask.
                            <DirectIngestSetup deviceCode={device.deviceCode} />
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={device.isActive ? "success" : "warning"}>
                            {device.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge
                            tone={
                              device.health === "ONLINE"
                                ? "success"
                                : device.health === "STALE"
                                  ? "warning"
                                  : device.health === "OFFLINE"
                                    ? "danger"
                                    : "neutral"
                            }
                          >
                            {device.health === "NEVER_SEEN"
                              ? "Never seen"
                              : device.health}
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
                            onClick={() =>
                              setModal({ type: "diagnose", gpsDevice: device })
                            }
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            Diagnose
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

      {modal?.type === "diagnose" ? (
        <GpsDeviceDiagnoseModal
          gpsDevice={modal.gpsDevice}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}