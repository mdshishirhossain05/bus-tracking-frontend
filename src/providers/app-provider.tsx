"use client";

import { AuthProvider } from "@/providers/auth-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { NetworkProvider } from "@/providers/network-provider";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}