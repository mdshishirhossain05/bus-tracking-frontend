"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusFront, X } from "lucide-react";
import { SIDEBAR_NAV_ITEMS } from "@/lib/constants/nav";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  mobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const visibleItems = SIDEBAR_NAV_ITEMS.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const coreItems = visibleItems.filter(
    (item) =>
      !item.href.startsWith("/admin") || item.href === "/admin/operations",
  );

  const adminItems = visibleItems.filter(
    (item) =>
      item.href.startsWith("/admin") && item.href !== "/admin/operations",
  );

  function renderItem(item: (typeof visibleItems)[number]) {
    const active =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onCloseMobile?.()}
        className={cn(
          "group flex items-start gap-3 rounded-sm px-4 py-3 transition-all",
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-300 hover:bg-slate-800",
        )}
      >
        <div
          className={cn(
            "mt-0.5 rounded-sm p-2",
            active
              ? "bg-white/15 text-white"
              : "bg-slate-800 text-slate-400 group-hover:bg-slate-700",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium">{item.label}</p>
          <p
            className={cn(
              "mt-1 text-xs leading-5",
              active ? "text-blue-100" : "text-slate-500",
            )}
          >
            {item.description}
          </p>
        </div>
      </Link>
    );
  }

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5 lg:px-6 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
            <BusFront className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">
              University Bus System
            </p>
            <p className="text-xs text-slate-500">
              Realtime Operations Platform
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="icon"
          className="lg:hidden"
          onClick={() => onCloseMobile?.()}
          aria-label="Close sidebar"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {isLoading ? null : (
          <>
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Core
              </p>
              {coreItems.map(renderItem)}
            </div>

            {adminItems.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Administration
                </p>
                {adminItems.map(renderItem)}
              </div>
            )}
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-sm border border-blue-500/30 bg-blue-500/10 px-4 py-4">
          <p className="text-sm font-semibold text-blue-300">Operations Mode</p>
          <p className="mt-1 text-xs leading-5 text-blue-400">
            {user
              ? `Signed in as ${user.role}`
              : "Role-aware navigation will appear after session load."}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-[290px] shrink-0 border-r border-slate-800 bg-slate-900/70 backdrop-blur-xl lg:flex lg:flex-col">
        {sidebarBody}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-[1px] transition-opacity lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => onCloseMobile?.()}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarBody}
      </aside>
    </>
  );
}
