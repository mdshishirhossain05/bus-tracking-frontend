"use client";

import { useState } from "react";
import {
  BusFront,
  Clock3,
  Play,
  Satellite,
  Smartphone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error";
import { startAdminTrip } from "@/features/admin/api/admin.operations.api";
import type { AdminScheduledItem } from "@/features/admin/types.contracts";

interface AdminScheduledItemsCardProps {
  items: AdminScheduledItem[];
  onStarted?: () => void;
}

function formatDeparture(departureTime: string, secondsUntilDeparture: number) {
  const display = departureTime.slice(0, 5);

  if (secondsUntilDeparture <= -3600) {
    return `${display} • departed`;
  }
  if (secondsUntilDeparture < 0) {
    const lateMin = Math.round(-secondsUntilDeparture / 60);
    return `${display} • ${lateMin} min ago`;
  }
  if (secondsUntilDeparture < 60) {
    return `${display} • now`;
  }
  const inMin = Math.round(secondsUntilDeparture / 60);
  return `${display} • in ${inMin} min`;
}

function deviceTone(item: AdminScheduledItem) {
  const status = item.gpsDevice?.lastStatus;
  if (status === "HEALTHY") return "success" as const;
  if (status === "STALE") return "warning" as const;
  if (status === "UNHEALTHY" || status === "DISCONNECTED")
    return "danger" as const;
  return "neutral" as const;
}

function deviceStatusText(status: string | null | undefined) {
  switch (status) {
    case "HEALTHY":
      return "Healthy";
    case "STALE":
      return "Stale";
    case "UNHEALTHY":
      return "Unhealthy";
    case "DISCONNECTED":
      return "Disconnected";
    default:
      return null;
  }
}

export function AdminScheduledItemsCard({
  items,
  onStarted,
}: AdminScheduledItemsCardProps) {
  const [startingScheduleId, setStartingScheduleId] = useState<string | null>(
    null,
  );
  const [errorByScheduleId, setErrorByScheduleId] = useState<
    Record<string, string>
  >({});

  if (!items.length) return null;

  async function handleStart(item: AdminScheduledItem) {
    setStartingScheduleId(item.serviceScheduleId);
    setErrorByScheduleId((prev) => {
      const next = { ...prev };
      delete next[item.serviceScheduleId];
      return next;
    });

    try {
      await startAdminTrip(item.serviceScheduleId);
      onStarted?.();
    } catch (err) {
      setErrorByScheduleId((prev) => ({
        ...prev,
        [item.serviceScheduleId]: getApiErrorMessage(err),
      }));
    } finally {
      setStartingScheduleId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s schedules</CardTitle>
            <CardDescription>
              Active schedules with no running trip yet. Driver-bound schedules
              start when the driver opens their app; GPS-only schedules
              auto-start from the assigned device&apos;s telemetry — or use
              &ldquo;Start now&rdquo; to override.
            </CardDescription>
          </div>
          <Badge tone="info">{items.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.map((item) => {
          const isGpsAuto = item.tripStarter === "GPS_AUTO";
          const starting = startingScheduleId === item.serviceScheduleId;
          const inlineError = errorByScheduleId[item.serviceScheduleId];

          return (
            <div
              key={item.serviceScheduleId}
              className="rounded-sm border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.routeName}
                    </p>
                    <Badge tone={isGpsAuto ? "info" : "neutral"}>
                      {isGpsAuto ? (
                        <>
                          <Satellite className="h-3 w-3" /> GPS auto-start
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-3 w-3" /> Driver start
                        </>
                      )}
                    </Badge>
                    {item.gpsDevice ? (
                      <Badge tone={deviceTone(item)}>
                        Device {item.gpsDevice.deviceCode}
                        {deviceStatusText(item.gpsDevice.lastStatus)
                          ? ` • ${deviceStatusText(item.gpsDevice.lastStatus)}`
                          : ""}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>
                        {formatDeparture(
                          item.departureTime,
                          item.secondsUntilDeparture,
                        )}{" "}
                        • {item.dayType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BusFront className="h-3.5 w-3.5" />
                      <span>
                        {item.busLabel}
                        {item.plateNumber ? ` • ${item.plateNumber}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5" />
                      <span>
                        {item.driverName ?? "No driver — GPS device only"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <Button
                    variant="primary"
                    className="rounded-full"
                    onClick={() => void handleStart(item)}
                    disabled={starting}
                  >
                    <Play className="h-4 w-4" />
                    {starting ? "Starting…" : "Start now"}
                  </Button>
                  {inlineError ? (
                    <p className="text-xs text-red-300">{inlineError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
