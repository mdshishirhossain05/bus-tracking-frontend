import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/types/ui";

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: Tone;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  helper,
  tone = "neutral",
  trendLabel,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-colors hover:border-slate-700", className)}>
      <CardContent className="relative px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
              {value}
            </p>
            {helper ? (
              <p className="mt-2 text-sm text-slate-400">{helper}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            {icon ? (
              <div className="rounded-sm border border-slate-800 bg-slate-800/60 p-3 text-slate-300">
                {icon}
              </div>
            ) : null}

            {trendLabel ? (
              <Badge tone={tone} className="gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {trendLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
