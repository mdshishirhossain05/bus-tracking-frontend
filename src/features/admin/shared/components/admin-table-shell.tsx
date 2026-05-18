"use client";

import { cn } from "@/lib/utils/cn";

export function AdminTableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto overscroll-x-contain">
        {children}
      </div>
    </div>
  );
}