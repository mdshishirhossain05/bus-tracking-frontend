import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-800 text-slate-300 border-slate-700",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/10 text-red-400 border-red-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
