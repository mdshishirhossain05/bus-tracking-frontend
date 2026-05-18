import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageSection({
  title,
  description,
  action,
  className,
  children,
  ...props
}: PageSectionProps) {
  return (
    <section className={cn("space-y-4", className)} {...props}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-slate-100">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            ) : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      )}

      {children}
    </section>
  );
}
