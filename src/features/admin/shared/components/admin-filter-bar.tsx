"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function AdminFilterBar({
  children,
  className,
  onApply,
  onReset,
  applying = false,
}: {
  children: React.ReactNode;
  className?: string;
  onApply?: () => void;
  onReset?: () => void;
  applying?: boolean;
}) {
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div
      className={cn(
        "rounded-sm border border-slate-800 bg-slate-900 p-4",
        className,
      )}
    >
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {childArray.map((child, index) => (
          <div key={index} className="min-w-0">
            {child}
          </div>
        ))}
      </div>

      {(onReset || onApply) && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {onReset ? (
            <Button variant="secondary" onClick={onReset} className="w-full sm:w-auto">
              Reset
            </Button>
          ) : null}

          {onApply ? (
            <Button onClick={onApply} disabled={applying} className="w-full sm:w-auto">
              {applying ? "Applying..." : "Apply"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}