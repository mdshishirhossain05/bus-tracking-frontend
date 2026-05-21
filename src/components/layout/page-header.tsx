import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: Tone;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  badgeTone = "neutral",
  icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-900/40 p-4 panel-shadow sm:p-5 lg:flex lg:items-start lg:justify-between lg:gap-6 lg:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative flex min-w-0 items-start gap-4">
        {icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30 sm:flex">
            {icon}
          </div>
        ) : null}

        <div className="min-w-0">
          {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
          <h1
            className={cn(
              "text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl",
              badge ? "mt-3" : "",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {action ? (
        <div className="relative mt-4 shrink-0 lg:mt-0">{action}</div>
      ) : null}
    </div>
  );
}
