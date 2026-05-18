"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AdminRouteItem } from "../api/admin.routes.api";

interface RouteFormValues {
  routeName: string;
  description: string;
  isActive: boolean;
}

interface RouteFormModalProps {
  initial?: AdminRouteItem | null;
  submitting?: boolean;
  onSubmit: (values: {
    routeName: string;
    description: string | null;
    isActive: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function RouteFormModal({
  initial,
  submitting = false,
  onSubmit,
  onClose,
}: RouteFormModalProps) {
  const [values, setValues] = useState<RouteFormValues>({
    routeName: initial?.routeName ?? "",
    description: initial?.description ?? "",
    isActive: initial?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RouteFormValues, string>>>({});

  const title = useMemo(
    () => (initial ? "Edit Route" : "Create Route"),
    [initial],
  );

  function validate() {
    const nextErrors: Partial<Record<keyof RouteFormValues, string>> = {};

    if (!values.routeName.trim()) {
      nextErrors.routeName = "Route name is required.";
    } else if (values.routeName.trim().length < 2) {
      nextErrors.routeName = "Route name must be at least 2 characters.";
    }

    if (values.description.trim().length > 500) {
      nextErrors.description = "Description must be 500 characters or less.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    await onSubmit({
      routeName: values.routeName.trim(),
      description: values.description.trim() ? values.description.trim() : null,
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
              Define route metadata used for planning, assignment, and passenger visibility.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Route name
            </label>
            <Input
              placeholder="e.g. Main Campus → City Gate"
              value={values.routeName}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, routeName: e.target.value }))
              }
            />
            {errors.routeName ? (
              <p className="text-xs text-red-400">{errors.routeName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-sm border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              placeholder="Optional operational or passenger-facing route notes"
              value={values.description}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            {errors.description ? (
              <p className="text-xs text-red-400">{errors.description}</p>
            ) : null}
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
              {submitting ? "Saving..." : initial ? "Save changes" : "Create route"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}