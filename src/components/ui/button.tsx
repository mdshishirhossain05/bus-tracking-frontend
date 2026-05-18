import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500/40",
        secondary:
          "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 focus-visible:ring-slate-500/30",
        ghost:
          "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-500/30",
        danger:
          "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500/40",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-10 px-4",
        lg: "h-11 px-5",
        icon: "h-10 w-10",
        auto: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
