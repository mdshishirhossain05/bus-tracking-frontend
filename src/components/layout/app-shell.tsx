"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onOpenSidebar={() => setMobileSidebarOpen(true)} />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}