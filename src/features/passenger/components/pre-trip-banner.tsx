"use client";

import { ArrowRight, Bed, CheckCircle2 } from "lucide-react";
import type { ActiveTrip, TripPreTripPhaseValue } from "@/types/trip";

interface PreTripBannerProps {
  trip: ActiveTrip | null;
}

type Copy = {
  badge: string;
  title: string;
  body: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
};

function copyFor(phase: TripPreTripPhaseValue): Copy {
  switch (phase) {
    case "AT_DEPOT":
      return {
        badge: "PRE-TRIP",
        title: "Bus is parked at the depot",
        body: "Waiting for departure. We'll show you the live location as soon as it starts moving.",
        Icon: Bed,
        iconColor: "text-slate-300",
      };
    case "APPROACHING_ORIGIN":
      return {
        badge: "PRE-TRIP",
        title: "Bus is on the way",
        body: "Driving toward the start point.",
        Icon: ArrowRight,
        iconColor: "text-blue-300",
      };
    case "AT_ORIGIN":
      return {
        badge: "PRE-TRIP",
        title: "Bus has arrived at the start",
        body: "Boarding soon — the trip will start any moment.",
        Icon: CheckCircle2,
        iconColor: "text-emerald-300",
      };
  }
}

/**
 * Renders only while the selected trip is in PRE_TRIP — surfaces the
 * exact phase (parked / approaching / arrived) so passengers see the
 * bus's state BEFORE the driver formally starts the trip. Mirrors the
 * mobile `PreTripBanner`.
 */
export function PreTripBanner({ trip }: PreTripBannerProps) {
  if (!trip || trip.status !== "PRE_TRIP" || !trip.preTripPhase) return null;
  const copy = copyFor(trip.preTripPhase);
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950/30">
        <copy.Icon className={`h-5 w-5 ${copy.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
            {copy.badge}
          </span>
          <p className="truncate text-sm font-semibold text-slate-100">
            {copy.title}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-400">{copy.body}</p>
      </div>
    </div>
  );
}
