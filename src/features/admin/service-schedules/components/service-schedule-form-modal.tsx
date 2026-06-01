"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  BusOption,
  DayType,
  DriverOption,
  RouteOperationalReadiness,
  RouteOption,
  ServiceScheduleItem,
} from "../api/admin.service-schedules.api";
import {
  getBusOptions,
  getDriverOptions,
  getRouteOperationalReadiness,
  getRouteOptions,
  searchDriverOptions,
} from "../api/admin.service-schedules.api";

interface ServiceScheduleFormModalProps {
  initial?: ServiceScheduleItem | null;
  submitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: {
    routeId: string;
    busId: string;
    driverId: string | null;
    dayType: DayType;
    departureTime: string;
    isActive: boolean;
    notes: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  routeId: string;
  busId: string;
  driverId: string;
  dayType: DayType;
  departureTime: string;
  isActive: boolean;
  notes: string;
  driverSearch: string;
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/**
 * `<input type="time">` round-trips HH:mm. The backend stores HH:mm:ss.
 * Strip seconds when seeding the input; the change handler adds them
 * back on save.
 */
function normalizeTimeForInput(value: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

/** Render an HH:mm[:ss] string in human 12-hour form for the helper hint. */
function formatTwelveHour(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;
  const h = Number(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${period}`;
}

const DAY_OPTIONS: DayType[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function mergeDrivers(
  drivers: DriverOption[],
  initial?: ServiceScheduleItem | null,
) {
  const merged = [...drivers];

  if (
    initial?.driverId &&
    initial.driverName &&
    !merged.some((item) => item.id === initial.driverId)
  ) {
    merged.unshift({
      id: initial.driverId,
      fullName: initial.driverName,
      email: initial.driverEmail ?? "",
      role: "DRIVER",
      isActive: true,
      approvalStatus: "APPROVED",
    });
  }

  return merged;
}

export function ServiceScheduleFormModal({
  initial,
  submitting = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: ServiceScheduleFormModalProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [driverLoading, setDriverLoading] = useState(false);
  const [routeReadiness, setRouteReadiness] =
    useState<RouteOperationalReadiness | null>(null);
  const [routeReadinessLoading, setRouteReadinessLoading] = useState(false);

  const [values, setValues] = useState<FormState>({
    routeId: initial?.routeId ?? "",
    busId: initial?.busId ?? "",
    driverId: initial?.driverId ?? "",
    dayType: initial?.dayType ?? "SUNDAY",
    departureTime: initial?.departureTime ?? "",
    isActive: initial?.isActive ?? true,
    notes: initial?.notes ?? "",
    driverSearch: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const title = useMemo(
    () => (initial ? "Edit Service Schedule" : "Create Service Schedule"),
    [initial],
  );

  useEffect(() => {
    let active = true;

    async function boot() {
      setOptionsLoading(true);
      setDriverLoading(true);

      try {
        const [routeOptions, busOptions, driverOptions] = await Promise.all([
          getRouteOptions(),
          getBusOptions(),
          getDriverOptions(),
        ]);

        if (!active) return;

        setRoutes(routeOptions);
        setBuses(busOptions);
        setDrivers(mergeDrivers(driverOptions, initial));
      } finally {
        if (active) {
          setOptionsLoading(false);
          setDriverLoading(false);
        }
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, [initial]);

  useEffect(() => {
    let active = true;
    const query = values.driverSearch.trim();

    async function loadDrivers() {
      setDriverLoading(true);

      try {
        const result =
          query.length >= 2
            ? await searchDriverOptions(query)
            : await getDriverOptions();

        if (!active) return;

        setDrivers(mergeDrivers(result, initial));
      } finally {
        if (active) {
          setDriverLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadDrivers();
    }, query.length >= 2 ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [values.driverSearch, initial]);

  useEffect(() => {
    let active = true;

    async function loadRouteReadiness() {
      if (!values.routeId) {
        setRouteReadiness(null);
        return;
      }

      setRouteReadinessLoading(true);

      try {
        const readiness = await getRouteOperationalReadiness(values.routeId);
        if (!active) return;
        setRouteReadiness(readiness);
      } catch {
        if (!active) return;
        setRouteReadiness({
          routeId: values.routeId,
          routeName: "Unknown route",
          isReady: false,
          stopCount: 0,
          issues: ["Route readiness could not be verified."],
        });
      } finally {
        if (active) {
          setRouteReadinessLoading(false);
        }
      }
    }

    void loadRouteReadiness();

    return () => {
      active = false;
    };
  }, [values.routeId]);

  const selectedDriver = drivers.find((item) => item.id === values.driverId);
  const selectedBus = buses.find((item) => item.id === values.busId);

  // A schedule needs *some* tracking source. If the selected bus has a GPS
  // device assigned, the driver field is optional — the GPS device will be
  // the tracking source and the trip will auto-start from telematics.
  const driverOptional = Boolean(selectedBus?.hasActiveGpsDevice);

  const selectableRoutes = useMemo(() => {
    const activeRoutes = routes.filter((route) => route.isActive);

    if (
      initial?.routeId &&
      !activeRoutes.some((route) => route.id === initial.routeId)
    ) {
      const initialRoute = routes.find((route) => route.id === initial.routeId);
      if (initialRoute) {
        return [initialRoute, ...activeRoutes];
      }
    }

    return activeRoutes;
  }, [routes, initial?.routeId]);

  const selectableBuses = useMemo(() => {
    const activeBuses = buses.filter((bus) => bus.isActive);

    if (
      initial?.busId &&
      !activeBuses.some((bus) => bus.id === initial.busId)
    ) {
      const initialBus = buses.find((bus) => bus.id === initial.busId);
      if (initialBus) {
        return [initialBus, ...activeBuses];
      }
    }

    return activeBuses;
  }, [buses, initial?.busId]);

  function validate() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!values.routeId) nextErrors.routeId = "Route is required.";
    if (!values.busId) nextErrors.busId = "Bus is required.";
    if (!driverOptional && !values.driverId) {
      nextErrors.driverId =
        "Driver is required (or assign a GPS device to the bus first).";
    }

    if (!values.departureTime.trim()) {
      nextErrors.departureTime = "Departure time is required.";
    } else if (!timeRegex.test(values.departureTime.trim())) {
      nextErrors.departureTime = "Use HH:mm or HH:mm:ss format.";
    }

    if (values.notes.trim().length > 500) {
      nextErrors.notes = "Notes must be 500 characters or less.";
    }

    if (routeReadiness && !routeReadiness.isReady) {
      nextErrors.routeId =
        "Selected route is not operationally ready for scheduling.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    await onSubmit({
      routeId: values.routeId,
      busId: values.busId,
      // null = GPS-only schedule (allowed when the bus has a GPS device).
      driverId: values.driverId ? values.driverId : null,
      dayType: values.dayType,
      departureTime: values.departureTime.trim(),
      isActive: values.isActive,
      notes: values.notes.trim() ? values.notes.trim() : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-sm">
        <CardContent className="max-h-[calc(100vh-2rem)] space-y-5 overflow-y-auto p-4 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create or update operational schedules by assigning a ready route,
              active bus, active driver, exact day, and departure time.
            </p>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-3">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-100">
                  Recommended setup order
                </p>
                <p className="mt-1">
                  Create driver → create bus → create route → assign route stops
                  → create service schedule.
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="flex items-start gap-3 rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Schedule save failed</p>
                <p className="mt-1 leading-6">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Route
              </label>
              <Select
                value={values.routeId}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, routeId: e.target.value }))
                }
                disabled={optionsLoading}
              >
                <option value="">Select active route</option>
                {selectableRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeName}
                    {!route.isActive ? " (Inactive)" : ""}
                  </option>
                ))}
              </Select>
              {errors.routeId ? (
                <p className="text-xs text-red-400">{errors.routeId}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bus</label>
              <Select
                value={values.busId}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, busId: e.target.value }))
                }
                disabled={optionsLoading}
              >
                <option value="">Select active bus</option>
                {selectableBuses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.busCode}
                    {bus.plateNumber ? ` • ${bus.plateNumber}` : ""}
                    {bus.hasActiveGpsDevice ? " • GPS" : ""}
                    {!bus.isActive ? " (Inactive)" : ""}
                  </option>
                ))}
              </Select>
              {errors.busId ? (
                <p className="text-xs text-red-400">{errors.busId}</p>
              ) : null}
            </div>
          </div>

          {values.routeId ? (
            <div
              className={`rounded-sm border px-4 py-3 text-sm ${
                routeReadinessLoading
                  ? "border-slate-800 bg-slate-950 text-slate-400"
                  : routeReadiness?.isReady
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {routeReadinessLoading ? (
                <p>Checking route readiness...</p>
              ) : routeReadiness?.isReady ? (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Route is operationally ready</p>
                    <p className="mt-1">
                      {routeReadiness.routeName} has{" "}
                      {routeReadiness.stopCount} assigned stop
                      {routeReadiness.stopCount > 1 ? "s" : ""} and can be
                      scheduled.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      Route is not ready for scheduling
                    </p>
                    <ul className="mt-1 list-disc pl-5">
                      {routeReadiness?.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Search driver
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-9"
                placeholder="Search by driver name or email"
                value={values.driverSearch}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    driverSearch: e.target.value,
                  }))
                }
              />
            </div>
            <p className="text-xs text-slate-500">
              Active approved DRIVER accounts are loaded automatically. Search
              narrows the dropdown.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Driver{" "}
              <span className="text-xs font-normal text-slate-500">
                {driverOptional ? "(optional)" : "(required)"}
              </span>
            </label>
            <Select
              value={values.driverId}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, driverId: e.target.value }))
              }
              disabled={driverLoading}
            >
              <option value="">
                {driverLoading
                  ? "Loading drivers..."
                  : driverOptional
                    ? "No driver — track via GPS device"
                    : drivers.length === 0
                      ? "No active drivers found"
                      : "Select active driver"}
              </option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName} • {driver.email}
                </option>
              ))}
            </Select>
            {driverOptional && !values.driverId ? (
              <p className="text-xs text-emerald-400">
                This bus has an active GPS device — the trip will auto-start
                from telematics, no driver phone needed.
              </p>
            ) : selectedDriver ? (
              <p className="text-xs text-slate-500">
                Selected: {selectedDriver.fullName} ({selectedDriver.email})
              </p>
            ) : null}
            {errors.driverId ? (
              <p className="text-xs text-red-400">{errors.driverId}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Day</label>
              <Select
                value={values.dayType}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    dayType: e.target.value as DayType,
                  }))
                }
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Departure time
                <span className="ml-2 text-xs font-normal text-slate-500">
                  (Dhaka local · 24-hour)
                </span>
              </label>
              <Input
                type="time"
                step={60}
                placeholder="16:30"
                value={normalizeTimeForInput(values.departureTime)}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    // Always emit HH:mm:ss to the backend so the Time column
                    // is unambiguous; the native picker hands us HH:mm.
                    departureTime: e.target.value
                      ? `${e.target.value}:00`
                      : "",
                  }))
                }
              />
              <p className="text-xs text-slate-500">
                Enter the bus's local Dhaka departure time. Examples:{" "}
                <span className="font-mono text-slate-400">08:30</span> = 8:30 AM,{" "}
                <span className="font-mono text-slate-400">16:30</span> = 4:30 PM.
                {values.departureTime
                  ? ` Saving as ${formatTwelveHour(values.departureTime)}.`
                  : ""}
              </p>
              {errors.departureTime ? (
                <p className="text-xs text-red-400">{errors.departureTime}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Status
              </label>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Notes</label>
            <textarea
              className="min-h-[120px] w-full rounded-sm border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Optional operational notes"
              value={values.notes}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
            {errors.notes ? (
              <p className="text-xs text-red-400">{errors.notes}</p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={
                submitting ||
                optionsLoading ||
                driverLoading ||
                routeReadinessLoading ||
                (routeReadiness != null && !routeReadiness.isReady)
              }
            >
              {submitting
                ? "Saving..."
                : initial
                  ? "Save changes"
                  : "Create schedule"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}