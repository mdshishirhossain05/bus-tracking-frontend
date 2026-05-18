"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface PasswordInputProps extends Omit<InputProps, "type"> {
  /** Optional leading icon rendered inside the field. */
  leftIcon?: React.ReactNode;
}

/**
 * Password input with a built-in show/hide visibility toggle. Keeps each
 * password field consistent across the app without repeating the toggle.
 */
export function PasswordInput({
  className,
  leftIcon,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
          {leftIcon}
        </span>
      ) : null}

      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(leftIcon && "pl-9", "pr-10", className)}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
