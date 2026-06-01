"use client";

import { CheckCircle2, MapPin, Radio, Timer } from "lucide-react";
import type { ActiveTrip } from "@/types/trip";

type HeroState = "waiting" | "preTrip" | "live" | "ended";

function resolveState(
  selectedTrip: ActiveTrip | null,
  tripEnded: boolean,
): HeroState {
  if (tripEnded) return "ended";
  if (!selectedTrip) return "waiting";
  if (selectedTrip.status === "RUNNING") return "live";
  if (selectedTrip.status === "PRE_TRIP") return "preTrip";
  if (selectedTrip.status === "ENDED") return "ended";
  return "waiting";
}

const COPY: Record<
  HeroState,
  {
    title: string;
    body: string;
    badge: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    surfaceClass: string;
    badgeClass: string;
  }
> = {
  waiting: {
    title: "Waiting for the bus",
    body: "No bus is broadcasting on this route yet. We'll show the live position the moment it starts.",
    badge: "WAITING",
    Icon: MapPin,
    iconColor: "text-slate-400",
    surfaceClass: "border-slate-800/70 bg-slate-900/60",
    badgeClass: "bg-slate-800 text-slate-300",
  },
  preTrip: {
    title: "Trip hasn't started yet",
    body: "ETA + stop progression will appear once the driver starts the trip.",
    badge: "PRE-TRIP",
    Icon: Timer,
    iconColor: "text-blue-300",
    surfaceClass: "border-blue-500/40 bg-blue-500/10",
    badgeClass: "bg-blue-500/20 text-blue-200",
  },
  live: {
    title: "LIVE — bus is on route",
    body: "Tracking in real time. See where it is and when it reaches your stop.",
    badge: "LIVE",
    Icon: Radio,
    iconColor: "text-emerald-300",
    surfaceClass: "border-emerald-500/40 bg-emerald-500/10",
    badgeClass: "bg-emerald-500/20 text-emerald-200",
  },
  ended: {
    title: "Trip ended",
    body: "The driver has finished this trip.",
    badge: "ENDED",
    Icon: CheckCircle2,
    iconColor: "text-slate-400",
    surfaceClass: "border-slate-800/70 bg-slate-900/60",
    badgeClass: "bg-slate-800 text-slate-300",
  },
};

interface LiveStatusHeroProps {
  selectedTrip: ActiveTrip | null;
  tripEnded: boolean;
}

/**
 * Mirror of the mobile TripSheet hero block: an always-visible
 * "what state is this bus in right now" banner so passengers never
 * have to guess from a status badge or empty ETA value.
 */
export function LiveStatusHero({
  selectedTrip,
  tripEnded,
}: LiveStatusHeroProps) {
  const state = resolveState(selectedTrip, tripEnded);
  const copy = COPY[state];
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${copy.surfaceClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950/40">
        <copy.Icon className={`h-5 w-5 ${copy.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${copy.badgeClass}`}
          >
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

export type { HeroState };
export { resolveState as resolveHeroState };
