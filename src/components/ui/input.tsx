import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-sm border border-slate-700 bg-slate-950 px-3.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
