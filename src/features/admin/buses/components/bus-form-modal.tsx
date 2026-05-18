"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminBusItem } from "../api/admin.buses.api";

interface BusFormState {
  busCode: string;
  plateNumber: string;
  capacity: string;
  isActive: boolean;
}

interface BusFormModalProps {
  initial?: AdminBusItem | null;
  submitting?: boolean;
  onSubmit: (values: {
    busCode: string;
    plateNumber: string | null;
    capacity: number | null;
    isActive: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function BusFormModal({
  initial,
  submitting = false,
  onSubmit,
  onClose,
}: BusFormModalProps) {
  const [values, setValues] = useState<BusFormState>({
    busCode: initial?.busCode ?? "",
    plateNumber: initial?.plateNumber ?? "",
    capacity:
      initial?.capacity == null || Number.isNaN(initial.capacity)
        ? ""
        : String(initial.capacity),
    isActive: initial?.isActive ?? true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BusFormState | "plateNumber", string>>
  >({});

  const title = useMemo(
    () => (initial ? "Edit Bus" : "Create Bus"),
    [initial],
  );

  function validate() {
    const nextErrors: Partial<Record<keyof BusFormState | "plateNumber", string>> =
      {};

    if (!values.busCode.trim()) {
      nextErrors.busCode = "Bus code is required.";
    } else if (values.busCode.trim().length < 2) {
      nextErrors.busCode = "Bus code must be at least 2 characters.";
    }

    if (values.plateNumber.trim() && values.plateNumber.trim().length < 3) {
      nextErrors.plateNumber = "Plate number must be at least 3 characters.";
    }

    if (values.capacity.trim() === "") {
      nextErrors.capacity = "Capacity is required.";
    } else {
      const capacity = Number(values.capacity);
      if (
        Number.isNaN(capacity) ||
        !Number.isInteger(capacity) ||
        capacity < 1 ||
        capacity > 500
      ) {
        nextErrors.capacity = "Capacity must be an integer between 1 and 500.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    await onSubmit({
      busCode: values.busCode.trim(),
      plateNumber: values.plateNumber.trim()
        ? values.plateNumber.trim()
        : null,
      capacity: values.capacity.trim() ? Number(values.capacity) : null,
      isActive: values.isActive,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-sm">
        <CardContent className="space-y-5 p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Register buses used in live trip operations, GPS assignment, and service scheduling.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Bus code *
            </label>
            <Input
              placeholder="e.g. BUS-01"
              value={values.busCode}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, busCode: e.target.value }))
              }
            />
            {errors.busCode ? (
              <p className="text-xs text-red-400">{errors.busCode}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Plate number
              </label>
              <Input
                placeholder="e.g. DHAKA-METRO-1234"
                value={values.plateNumber}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    plateNumber: e.target.value,
                  }))
                }
              />
              {errors.plateNumber ? (
                <p className="text-xs text-red-400">{errors.plateNumber}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Capacity *
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 40"
                value={values.capacity}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, capacity: e.target.value }))
                }
              />
              {errors.capacity ? (
                <p className="text-xs text-red-400">{errors.capacity}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-medium text-slate-200">
              Operational note
            </p>
            <p className="mt-1 text-xs text-slate-500">
              A bus can exist without an assigned GPS device, but it becomes operationally ready for hardware tracking only after a GPS device is assigned.
            </p>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? "Saving..." : initial ? "Save changes" : "Create bus"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}