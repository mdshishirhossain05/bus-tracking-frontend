"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { AppToast, ToastTone } from "@/types/toast";

interface ToastContextValue {
  toasts: AppToast[];
  pushToast: (toast: Omit<AppToast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  danger: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function buildToast(
  tone: ToastTone,
  title: string,
  description?: string,
): AppToast {
  return {
    id: crypto.randomUUID(),
    tone,
    title,
    description,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<AppToast, "id">) => {
    const next: AppToast = {
      id: crypto.randomUUID(),
      ...toast,
    };

    setToasts((prev) => [...prev, next]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== next.id));
    }, 4000);
  }, []);

  const typedPush = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      pushToast(buildToast(tone, title, description));
    },
    [pushToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      pushToast,
      removeToast,
      success: (title, description) => typedPush("success", title, description),
      info: (title, description) => typedPush("info", title, description),
      warning: (title, description) => typedPush("warning", title, description),
      danger: (title, description) => typedPush("danger", title, description),
    }),
    [pushToast, removeToast, toasts, typedPush],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}