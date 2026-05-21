import { cn } from "@/lib/utils/cn";

export type StatTone = "blue" | "amber" | "violet" | "emerald" | "slate";

const chipClass: Record<StatTone, string> = {
  blue: "bg-blue-500/15 text-blue-300",
  amber: "bg-amber-500/15 text-amber-300",
  violet: "bg-violet-500/15 text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  slate: "bg-slate-500/15 text-slate-300",
};

interface StatTileProps {
  tone?: StatTone;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  emphasize?: boolean;
  className?: string;
}

export function StatTile({
  tone = "slate",
  icon,
  label,
  value,
  hint,
  emphasize = false,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:border-slate-700",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            chipClass[tone],
          )}
        >
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 truncate font-semibold text-slate-100",
          emphasize ? "text-2xl" : "text-sm",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
