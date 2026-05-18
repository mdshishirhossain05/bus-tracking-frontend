import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function ContentWrap({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8",
        className,
      )}
      {...props}
    />
  );
}