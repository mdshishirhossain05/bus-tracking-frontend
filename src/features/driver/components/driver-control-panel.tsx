import {
  Play,
  Square,
  Send,
  LocateFixed,
  TimerReset,
  LoaderCircle,
  Smartphone,
  Satellite,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type {
  DriverTrackingSourceSummary,
  LocationPermissionState,
  PublishState,
  StartReadinessStage,
} from "@/features/driver/types";

interface DriverControlPanelProps {
  canStart: boolean;
  canEnd: boolean;
  started: boolean;
  submittingStart: boolean;
  submittingEnd: boolean;
  publishState: PublishState;
  permission: LocationPermissionState;
  publishIntervalMs: number;
  startReadinessStage: StartReadinessStage;
  trackingSource: DriverTrackingSourceSummary | null;
  onChangeInterval: (value: number) => void;
  onRequestPermission: () => void;
  onStartTrip: () => void;
  onEndTrip: () => void;
  onSendNow: () => void;
}

function getStartButtonLabel(
  submittingStart: boolean,
  startReadinessStage: StartReadinessStage,
) {
  if (!submittingStart) return "Start Trip";

  switch (startReadinessStage) {
    case "checking":
      return "Checking location...";
    case "requesting_permission":
      return "Allow location access...";
    case "acquiring_fix":
      return "Getting usable GPS...";
    case "starting_trip":
      return "Starting trip...";
    default:
      return "Starting...";
  }
}

function toneForSourceStatus(status: string | null | undefined) {
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

function sourceLabel(source: DriverTrackingSourceSummary | null) {
  if (source?.sourceLabel) return source.sourceLabel;
  if (source?.sourceType === "GPS_DEVICE") return "GPS Device";
  if (source?.sourceType === "DRIVER_MOBILE") return "Driver Mobile";
  return "Unknown Source";
}

function sourceDescription(source: DriverTrackingSourceSummary | null) {
  if (!source?.sourceType) {
    return "Tracking source will appear once live canonical trip state is available.";
  }

  if (source.sourceType === "GPS_DEVICE") {
    return "Fixed GPS is currently powering live tracking. Driver mobile can still control the trip and remain available as fallback.";
  }

  return "Driver mobile is currently powering live tracking for this trip.";
}

export function DriverControlPanel({
  canStart,
  canEnd,
  started,
  submittingStart,
  submittingEnd,
  publishState,
  permission,
  publishIntervalMs,
  startReadinessStage,
  trackingSource,
  onChangeInterval,
  onRequestPermission,
  onStartTrip,
  onEndTrip,
  onSendNow,
}: DriverControlPanelProps) {
  const canSendNow =
    started &&
    permission === "granted" &&
    publishState !== "sending" &&
    publishState !== "recovering";

  const permissionHelpText =
    permission === "granted"
      ? "Location access is already granted on this device/browser."
      : permission === "denied"
        ? "Location access is blocked in browser or device settings."
        : permission === "unsupported"
          ? "This device/browser does not support geolocation."
          : "Start Trip will request location access, then continue automatically.";

  const isGpsSelected = trackingSource?.sourceType === "GPS_DEVICE";

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Trip Control</CardTitle>
        <CardDescription>
          Start and end the trip, verify device location access, and control live publishing.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">
              {isGpsSelected ? (
                <Satellite className="h-3.5 w-3.5" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              {sourceLabel(trackingSource)}
            </Badge>
            <Badge tone={toneForSourceStatus(trackingSource?.sourceStatus)}>
              {trackingSource?.sourceStatus ?? "UNKNOWN"}
            </Badge>
            {trackingSource?.selectionReason ? (
              <Badge tone="neutral">{trackingSource.selectionReason}</Badge>
            ) : null}
          </div>

          <p className="text-xs leading-5 text-slate-400">
            {sourceDescription(trackingSource)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={onStartTrip}
            disabled={!canStart || submittingStart}
            className="h-12 text-sm font-semibold"
          >
            {submittingStart ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {getStartButtonLabel(submittingStart, startReadinessStage)}
          </Button>

          <Button
            variant="danger"
            onClick={onEndTrip}
            disabled={!canEnd || submittingEnd}
            className="h-12 text-sm font-semibold"
          >
            <Square className="h-4 w-4" />
            {submittingEnd ? "Ending..." : "End Trip"}
          </Button>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <LocateFixed className="h-4 w-4" />
            <p className="text-sm font-medium">Location access</p>
          </div>

          <Button
            variant="secondary"
            onClick={onRequestPermission}
            className="h-11 w-full justify-center text-sm font-medium"
            disabled={permission === "unsupported"}
          >
            <LocateFixed className="h-4 w-4" />
            {permission === "granted"
              ? "Location already allowed"
              : permission === "denied"
                ? "Retry location access"
                : "Request location access"}
          </Button>

          <p className="mt-2 text-xs text-slate-500">{permissionHelpText}</p>
        </div>

        <div className="rounded-sm border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-400">
            <TimerReset className="h-4 w-4" />
            <p className="text-sm font-medium">Publishing interval</p>
          </div>

          <Select
            value={String(publishIntervalMs)}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            className="w-full"
            disabled={!started}
          >
            <option value="2000">Every 2 sec</option>
            <option value="3000">Every 3 sec</option>
            <option value="5000">Every 5 sec</option>
          </Select>
          <p className="mt-2 text-xs text-slate-500">
            Recommended: 2 sec while moving, 5 sec while stationary.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-2">
          <Button
            variant="secondary"
            onClick={onSendNow}
            disabled={!canSendNow}
            className="h-12 w-full text-sm font-semibold"
          >
            <Send className="h-4 w-4" />
            {publishState === "sending"
              ? "Sending location..."
              : publishState === "recovering"
                ? "Recovering GPS..."
                : "Send location now"}
          </Button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Manual send is available for live testing and recovery.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}