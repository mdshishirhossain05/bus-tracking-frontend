"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error";
import {
  getServiceSchedules,
  type ServiceScheduleItem,
} from "@/features/admin/service-schedules/api/admin.service-schedules.api";
import { startAdminTrip } from "@/features/admin/api/admin.operations.api";

interface StartTripModalProps {
  onClose: () => void;
  onStarted: () => void;
}

export function StartTripModal({ onClose, onStarted }: StartTripModalProps) {
  const toast = useToast();
  const [schedules, setSchedules] = useState<ServiceScheduleItem[]>([]);
  const [scheduleId, setScheduleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void getServiceSchedules({ isActive: true, limit: 100 })
      .then((res) => {
        if (active) setSchedules(res.items);
      })
      .catch(() => {
        if (active) setError("Failed to load service schedules.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleStart() {
    if (!scheduleId) {
      setError("Select a service schedule to start.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await startAdminTrip(scheduleId);
      toast.success("Trip started", "The trip is now running.");
      onStarted();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to start the trip."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-t-3xl sm:rounded-sm">
        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                Start a trip
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Manually start a trip from a service schedule when neither the
                driver nor GPS auto-start has begun it.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-sm p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Service schedule
            </label>
            <Select
              value={scheduleId}
              disabled={loading}
              onChange={(e) => setScheduleId(e.target.value)}
            >
              <option value="">
                {loading ? "Loading schedules..." : "Select a schedule"}
              </option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.routeName} · {schedule.busCode} ·{" "}
                  {schedule.dayType} {schedule.departureTime}
                </option>
              ))}
            </Select>
            {!loading && schedules.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active service schedules are available to start.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStart()}
              disabled={submitting || loading}
            >
              <Play className="h-4 w-4" />
              {submitting ? "Starting..." : "Start trip"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
