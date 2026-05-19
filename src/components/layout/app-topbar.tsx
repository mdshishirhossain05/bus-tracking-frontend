"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Wifi,
  UserCircle2,
  Settings,
  Route,
  BusFront,
  Shield,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { SIDEBAR_NAV_ITEMS } from "@/lib/constants/nav";
import { cn } from "@/lib/utils/cn";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/features/notifications/api/notifications.api";

interface AppTopbarProps {
  onOpenSidebar?: () => void;
}

export function AppTopbar({ onOpenSidebar }: AppTopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(() => {
    if (!user) return [];
    return SIDEBAR_NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  }, [user]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return visibleItems.filter((item) => {
      return (
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, visibleItems]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const state = await getNotifications();
      setNotifications(state.items);
      setUnreadCount(state.unreadCount);
    } catch {
      // Notifications are non-critical.
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const state = await markAllNotificationsRead();
      setNotifications(state.items);
      setUnreadCount(state.unreadCount);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (item: AppNotification) => {
    setNotificationsOpen(false);

    if (!item.isRead) {
      try {
        const state = await markNotificationRead(item.id);
        setNotifications(state.items);
        setUnreadCount(state.unreadCount);
      } catch {
        // ignore
      }
    }

    if (item.link) router.push(item.link);
  };

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setSubmitting(true);
      await logout();
      router.replace("/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchNavigate = (href: string) => {
    setSearchQuery("");
    setSearchOpen(false);
    router.push(href);
  };

  const goToAccount = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
    router.push("/account");
  };

  const goToHref = (href?: string) => {
    if (!href) return;
    setNotificationsOpen(false);
    setProfileOpen(false);
    setSearchOpen(false);
    router.push(href);
  };

  const initials =
    user?.fullName?.slice(0, 2).toUpperCase() ??
    user?.email?.slice(0, 2).toUpperCase() ??
    "US";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <Button
          variant="secondary"
          size="icon"
          className="lg:hidden"
          aria-label="Open sidebar"
          onClick={() => onOpenSidebar?.()}
        >
          <Menu className="h-4.5 w-4.5" />
        </Button>

        <div ref={searchRef} className="min-w-0 flex-1">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
                setNotificationsOpen(false);
                setProfileOpen(false);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search pages, routes, trips, drivers..."
              className="pl-9 pr-3"
            />

            {searchOpen && searchQuery.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-xl">
                {searchResults.length ? (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {searchResults.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => handleSearchNavigate(item.href)}
                          className="flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                        >
                          <div className="rounded-sm bg-slate-800 p-2 text-slate-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    No matching navigation result found.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge tone="success" className="hidden md:inline-flex">
            <Wifi className="mr-1 h-3.5 w-3.5" />
            Live System
          </Badge>

          {user ? (
            <Badge tone="info" className="hidden sm:inline-flex">
              {user.role}
            </Badge>
          ) : null}

          <div ref={notificationsRef} className="relative">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Notifications"
              className="relative"
              onClick={() => {
                setNotificationsOpen((prev) => {
                  const next = !prev;
                  if (next) void loadNotifications();
                  return next;
                });
                setProfileOpen(false);
                setSearchOpen(false);
              }}
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Notifications
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "You're all caught up"}
                    </p>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  ) : null}
                </div>

                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-slate-500">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleNotificationClick(item)}
                        className={cn(
                          "w-full rounded-sm px-3 py-3 text-left hover:bg-slate-800",
                          !item.isRead && "bg-slate-800/50",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              item.isRead ? "bg-slate-700" : "bg-blue-500",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {item.body}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-600">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotificationsOpen(false);
                setSearchOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 rounded-sm border border-slate-700 bg-slate-900 px-2 py-2 transition hover:border-slate-600 hover:bg-slate-800 sm:px-3",
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-blue-600 text-sm font-semibold text-white">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-100">
                  {user?.fullName ?? "User"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email ?? "No email"}
                </p>
              </div>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,320px)] overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-xl">
                <div className="border-b border-slate-800 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-100">
                    {user?.fullName ?? "User"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {user?.email ?? "No email"}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={goToAccount}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                  >
                    <UserCircle2 className="h-4.5 w-4.5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Profile
                      </p>
                      <p className="text-xs text-slate-500">
                        Edit your profile and view account details
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={goToAccount}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                  >
                    <Settings className="h-4.5 w-4.5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Account settings
                      </p>
                      <p className="text-xs text-slate-500">
                        Change password and manage sessions
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToHref("/")}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                  >
                    <Route className="h-4.5 w-4.5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Quick navigation
                      </p>
                      <p className="text-xs text-slate-500">
                        Search and use the sidebar for role-aware movement
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      goToHref(
                        user?.role === "ADMIN" ? "/admin/operations" : "/",
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                  >
                    <BusFront className="h-4.5 w-4.5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-100">
                        Operations mode
                      </p>
                      <p className="text-xs text-slate-500">
                        Role-specific working surface is active
                      </p>
                    </div>
                  </button>

                  {user?.role === "ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => goToHref("/admin/users")}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                    >
                      <Users className="h-4.5 w-4.5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          Admin tools
                        </p>
                        <p className="text-xs text-slate-500">
                          User and operational administration controls
                        </p>
                      </div>
                    </button>
                  ) : null}

                  {user?.role !== "ADMIN" ? (
                    <button
                      type="button"
                      onClick={() => goToHref("/account")}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left hover:bg-slate-800"
                    >
                      <Shield className="h-4.5 w-4.5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          Security
                        </p>
                        <p className="text-xs text-slate-500">
                          Review sessions and secure your account
                        </p>
                      </div>
                    </button>
                  ) : null}

                  <div className="mt-2 border-t border-slate-800 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => void handleLogout()}
                      disabled={submitting}
                      className="w-full justify-center"
                    >
                      <LogOut className="h-4 w-4" />
                      {submitting ? "Signing out..." : "Logout"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
