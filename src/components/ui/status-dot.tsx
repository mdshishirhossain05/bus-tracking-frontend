import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
};

interface StatusDotProps {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}

export function StatusDot({
  tone = "neutral",
  pulse = false,
  className,
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        toneClasses[tone],
        pulse && "animate-pulse",
        className
      )}
    />
  );
}