"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import type { ToastTone } from "@/types/toast";

function toneStyles(tone: ToastTone) {
  switch (tone) {
    case "success":
      return {
        wrapper: "border-emerald-500/30 bg-emerald-500/10",
        icon: "text-emerald-400 bg-emerald-500/15",
      };
    case "warning":
      return {
        wrapper: "border-amber-500/30 bg-amber-500/10",
        icon: "text-amber-400 bg-amber-500/15",
      };
    case "danger":
      return {
        wrapper: "border-red-500/30 bg-red-500/10",
        icon: "text-red-400 bg-red-500/15",
      };
    case "info":
    default:
      return {
        wrapper: "border-blue-500/30 bg-blue-500/10",
        icon: "text-blue-400 bg-blue-500/15",
      };
  }
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  switch (tone) {
    case "success":
      return <CheckCircle2 className="h-4.5 w-4.5" />;
    case "warning":
      return <TriangleAlert className="h-4.5 w-4.5" />;
    case "danger":
      return <XCircle className="h-4.5 w-4.5" />;
    case "info":
    default:
      return <Info className="h-4.5 w-4.5" />;
  }
}

export function ToastStack() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const styles = toneStyles(tone);

        return (
          <div
            key={toast.id}
            className={cn(
              "animate-fade-in pointer-events-auto rounded-sm border bg-slate-900 p-4 shadow-lg backdrop-blur-xl",
              styles.wrapper,
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm",
                  styles.icon,
                )}
              >
                <ToneIcon tone={tone} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-sm p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
