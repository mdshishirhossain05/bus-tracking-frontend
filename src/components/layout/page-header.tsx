import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeTone?: Tone;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  badgeTone = "neutral",
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-sm border border-slate-800 bg-slate-900/80 p-4 panel-shadow sm:p-5 lg:flex-row lg:items-start lg:justify-between lg:p-6",
        className,
      )}
    >
      <div className="min-w-0">
        {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
