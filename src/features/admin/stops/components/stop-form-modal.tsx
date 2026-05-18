"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getStopUsage,
  type StopItem,
  type StopUsageDetails,
} from "../api/admin.stops.api";

const StopLocationPickerMap = dynamic(
  () =>
    import("./stop-location-picker-map").then(
      (mod) => mod.StopLocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-sm border border-slate-800 bg-slate-950 text-sm text-slate-500 sm:h-[360px]">
        Loading map...
      </div>
    ),
  },
);

interface StopFormModalProps {
  initial?: StopItem | null;
  allStops?: StopItem[];
  submitting?: boolean;
  onSubmit: (values: {
    stopName: string;
    stopCode?: string | null;
    landmark?: string | null;
    address?: string | null;
    notes?: string | null;
    isActive?: boolean;
    lat: number;
    lng: number;
  }) => Promise<void>;
  onClose: () => void;
}

interface StopFormState {
  stopName: string;
  stopCode: string;
  landmark: string;
  address: string;
  notes: string;
  isActive: boolean;
  lat: string;
  lng: string;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function StopFormModal({
  initial,
  allStops = [],
  submitting = false,
  onSubmit,
  onClose,
}: StopFormModalProps) {
  const [values, setValues] = useState<StopFormState>({
    stopName: initial?.stopName ?? "",
    stopCode: initial?.stopCode ?? "",
    landmark: initial?.landmark ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
    isActive: initial?.isActive ?? true,
    lat: initial?.lat != null ? String(initial.lat) : "",
    lng: initial?.lng != null ? String(initial.lng) : "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof StopFormState, string>>
  >({});
  const [lastAutoSuggestedName, setLastAutoSuggestedName] =
    useState<string>(initial?.stopName ?? "");
  const [lastAutoSuggestedAddress, setLastAutoSuggestedAddress] =
    useState<string>(initial?.address ?? "");
  const [usageDetails, setUsageDetails] = useState<StopUsageDetails | null>(
    null,
  );
  const [usageLoading, setUsageLoading] = useState(false);

  const stopNameTouchedRef = useRef(Boolean(initial?.stopName));
  const addressTouchedRef = useRef(Boolean(initial?.address));

  const title = useMemo(
    () => (initial ? "Edit Stop" : "Create Stop"),
    [initial],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      if (!initial?.id) {
        setUsageDetails(null);
        return;
      }

      try {
        setUsageLoading(true);
        const usage = await getStopUsage(initial.id);
        if (!cancelled) {
          setUsageDetails(usage);
        }
      } catch {
        if (!cancelled) {
          setUsageDetails(null);
        }
      } finally {
        if (!cancelled) {
          setUsageLoading(false);
        }
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, [initial?.id]);

  const parsedLat =
    values.lat.trim() === "" || Number.isNaN(Number(values.lat))
      ? null
      : Number(values.lat);

  const parsedLng =
    values.lng.trim() === "" || Number.isNaN(Number(values.lng))
      ? null
      : Number(values.lng);

  const duplicateInsights = useMemo(() => {
    const currentName = normalizeName(values.stopName);
    const lat = parsedLat;
    const lng = parsedLng;

    const exactNameMatches = allStops.filter((stop) => {
      if (initial?.id && stop.id === initial.id) return false;
      return (
        currentName.length > 0 && normalizeName(stop.stopName) === currentName
      );
    });

    const nearbyMatches =
      lat == null || lng == null
        ? []
        : allStops
            .filter((stop) => {
              if (initial?.id && stop.id === initial.id) return false;
              const distance = haversineMeters(lat, lng, stop.lat, stop.lng);
              return distance <= 40;
            })
            .map((stop) => ({
              ...stop,
              distanceMeters: Math.round(
                haversineMeters(lat, lng, stop.lat, stop.lng),
              ),
            }))
            .sort((a, b) => a.distanceMeters - b.distanceMeters);

    return {
      exactNameMatches,
      nearbyMatches,
    };
  }, [allStops, initial?.id, parsedLat, parsedLng, values.stopName]);

  function updateCoordinates(coords: { lat: number; lng: number }) {
    setValues((prev) => ({
      ...prev,
      lat: String(coords.lat),
      lng: String(coords.lng),
    }));

    setErrors((prev) => ({
      ...prev,
      lat: undefined,
      lng: undefined,
    }));
  }

  function handlePickLocation(payload: {
    lat: number;
    lng: number;
    suggestedStopName: string;
    fullAddress: string;
  }) {
    setValues((prev) => {
      const stopNameMatchesPreviousAuto =
        normalizeName(prev.stopName) === normalizeName(lastAutoSuggestedName);

      const addressMatchesPreviousAuto =
        prev.address.trim() === lastAutoSuggestedAddress.trim();

      const shouldReplaceName =
        !stopNameTouchedRef.current ||
        prev.stopName.trim().length === 0 ||
        stopNameMatchesPreviousAuto;

      const shouldReplaceAddress =
        !addressTouchedRef.current ||
        prev.address.trim().length === 0 ||
        addressMatchesPreviousAuto;

      return {
        ...prev,
        stopName: shouldReplaceName ? payload.suggestedStopName : prev.stopName,
        address: shouldReplaceAddress ? payload.fullAddress : prev.address,
        lat: String(payload.lat),
        lng: String(payload.lng),
      };
    });

    setLastAutoSuggestedName(payload.suggestedStopName);
    setLastAutoSuggestedAddress(payload.fullAddress);

    setErrors((prev) => ({
      ...prev,
      stopName: undefined,
      lat: undefined,
      lng: undefined,
    }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof StopFormState, string>> = {};

    const stopName = values.stopName.trim();
    const stopCode = values.stopCode.trim();
    const lat = Number(values.lat);
    const lng = Number(values.lng);

    if (!stopName) {
      nextErrors.stopName = "Stop name is required.";
    } else if (stopName.length < 2) {
      nextErrors.stopName = "Stop name must be at least 2 characters.";
    }

    if (stopCode.length > 0 && !/^[A-Za-z0-9_-]+$/.test(stopCode)) {
      nextErrors.stopCode =
        "Stop code may only contain letters, numbers, _ and -";
    }

    if (values.lat.trim() === "") {
      nextErrors.lat = "Latitude is required.";
    } else if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      nextErrors.lat = "Latitude must be between -90 and 90.";
    }

    if (values.lng.trim() === "") {
      nextErrors.lng = "Longitude is required.";
    } else if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      nextErrors.lng = "Longitude must be between -180 and 180.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    await onSubmit({
      stopName: values.stopName.trim(),
      stopCode: values.stopCode.trim() || null,
      landmark: values.landmark.trim() || null,
      address: values.address.trim() || null,
      notes: values.notes.trim() || null,
      isActive: values.isActive,
      lat: Number(values.lat),
      lng: Number(values.lng),
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm">
      <div className="flex min-h-dvh items-start justify-center overflow-y-auto p-3 sm:p-4">
        <Card className="my-4 w-full max-w-5xl rounded-sm">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create precise physical stops used in routes, live tracking, ETA
                calculation, and passenger-facing map visibility.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Stop name
                    </label>
                    <Input
                      placeholder="e.g. Main Gate"
                      value={values.stopName}
                      onChange={(e) => {
                        stopNameTouchedRef.current = true;
                        setValues((prev) => ({
                          ...prev,
                          stopName: e.target.value,
                        }));
                      }}
                    />
                    {errors.stopName ? (
                      <p className="text-xs text-red-400">{errors.stopName}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Stop code
                    </label>
                    <Input
                      placeholder="e.g. MG-01"
                      value={values.stopCode}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          stopCode: e.target.value,
                        }))
                      }
                    />
                    {errors.stopCode ? (
                      <p className="text-xs text-red-400">{errors.stopCode}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Landmark
                    </label>
                    <Input
                      placeholder="e.g. In front of main gate"
                      value={values.landmark}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          landmark: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Status
                    </label>
                    <select
                      className="h-11 w-full rounded-sm border border-slate-800 bg-slate-900 px-3.5 text-sm text-slate-100 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      value={values.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Address
                  </label>
                  <Input
                    placeholder="Full address or area description"
                    value={values.address}
                    onChange={(e) => {
                      addressTouchedRef.current = true;
                      setValues((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Notes
                  </label>
                  <textarea
                    className="flex min-h-[110px] w-full rounded-sm border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    placeholder="Operational notes, pickup details, direction hints..."
                    value={values.notes}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="0.0000001"
                      placeholder="23.8103310"
                      value={values.lat}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, lat: e.target.value }))
                      }
                    />
                    {errors.lat ? (
                      <p className="text-xs text-red-400">{errors.lat}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="0.0000001"
                      placeholder="90.4125210"
                      value={values.lng}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, lng: e.target.value }))
                      }
                    />
                    {errors.lng ? (
                      <p className="text-xs text-red-400">{errors.lng}</p>
                    ) : null}
                  </div>
                </div>

                {(duplicateInsights.exactNameMatches.length > 0 ||
                  duplicateInsights.nearbyMatches.length > 0) && (
                  <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      <div className="text-sm text-amber-300">
                        <p className="font-medium text-amber-300">
                          Possible duplicate stop detected
                        </p>

                        {duplicateInsights.exactNameMatches.length > 0 && (
                          <p className="mt-1">
                            Same name found:{" "}
                            {duplicateInsights.exactNameMatches
                              .map((stop) => stop.stopName)
                              .join(", ")}
                          </p>
                        )}

                        {duplicateInsights.nearbyMatches.length > 0 && (
                          <p className="mt-1">
                            Nearby stop(s):{" "}
                            {duplicateInsights.nearbyMatches
                              .slice(0, 3)
                              .map(
                                (stop) =>
                                  `${stop.stopName} (${stop.distanceMeters}m)`,
                              )
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {initial ? (
                  <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
                    <p className="font-medium text-slate-100">Usage preview</p>
                    {usageLoading ? (
                      <p className="mt-1">Loading usage...</p>
                    ) : usageDetails ? (
                      <>
                        <p className="mt-1">
                          Routes: {usageDetails.summary.routeStops} • Schedules:{" "}
                          {usageDetails.summary.schedules} • Arrivals:{" "}
                          {usageDetails.summary.stopArrivals}
                        </p>
                        {usageDetails.routeUsages.length > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Used in:{" "}
                            {usageDetails.routeUsages
                              .slice(0, 4)
                              .map(
                                (item) =>
                                  `${item.routeName} (#${item.stopOrder})`,
                              )
                              .join(", ")}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-1">Usage preview unavailable.</p>
                    )}
                  </div>
                ) : null}

                <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <LocateFixed className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="text-sm text-slate-400">
                      <p className="font-medium text-slate-100">
                        Faster stop placement
                      </p>
                      <p className="mt-1">
                        Search by place or address, use{" "}
                        <span className="font-medium">My Location</span> when
                        search cannot find the place, or click directly on the
                        map. Coordinates always update automatically, and stop
                        name/address auto-fill until you manually edit them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <StopLocationPickerMap
                  lat={parsedLat}
                  lng={parsedLng}
                  onChange={updateCoordinates}
                  onPickLocation={handlePickLocation}
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-800 bg-slate-900/95 pt-4 backdrop-blur sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Create stop"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}