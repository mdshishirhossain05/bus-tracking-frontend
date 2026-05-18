"use client";

import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ConfirmTone = "danger" | "warning" | "info";

const toneMap: Record<
  ConfirmTone,
  {
    icon: typeof AlertTriangle;
    panelClassName: string;
    iconClassName: string;
    confirmButtonVariant: "danger" | "secondary" | "primary";
  }
> = {
  danger: {
    icon: ShieldAlert,
    panelClassName: "border-red-500/30 bg-red-500/10 text-red-300",
    iconClassName: "text-red-300",
    confirmButtonVariant: "danger",
  },
  warning: {
    icon: AlertTriangle,
    panelClassName: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    iconClassName: "text-amber-300",
    confirmButtonVariant: "secondary",
  },
  info: {
    icon: Info,
    panelClassName: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    iconClassName: "text-blue-300",
    confirmButtonVariant: "primary",
  },
};

export function AdminConfirmModal({
  open = true,
  tone = "danger",
  title,
  description,
  warning,
  details,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  submitting = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  open?: boolean;
  tone?: ConfirmTone;
  title: string;
  description: string;
  warning?: string;
  details?: Array<{ label: string; value: string | number | null | undefined }>;
  confirmLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  if (!open) return null;

  const toneConfig = toneMap[tone];
  const Icon = toneConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-sm">
        <CardContent className="space-y-5 overflow-y-auto p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-100">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>

          {warning ? (
            <div
              className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-sm ${toneConfig.panelClassName}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${toneConfig.iconClassName}`} />
              <div>{warning}</div>
            </div>
          ) : null}

          {details && details.length > 0 ? (
            <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-3">
              <div className="space-y-2">
                {details.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="break-words text-left font-medium text-slate-100 sm:max-w-[60%] sm:text-right">
                      {item.value == null || item.value === "" ? "—" : item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={toneConfig.confirmButtonVariant}
              onClick={() => void onConfirm()}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Processing..." : confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}