import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";
import type { NotificationItem } from "../../types";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.api";
import { useAuth } from "../auth/AuthContext";
import { getSocket } from "../socket/socketClient";
import { SOCKET_EVENTS } from "../socket/socketEvents";

interface NotificationsValue {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(
  undefined,
);

// The socket only stays connected during an active trip view, so we poll as a
// reliable baseline and treat the realtime NOTIFICATION event as a bonus nudge.
const POLL_MS = 45000;

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // Best-effort; keep whatever we last had on a transient failure.
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // The next poll reconciles optimistic state with the server.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // Reconciled on next poll.
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    void refresh();
    const interval = setInterval(() => void refresh(), POLL_MS);
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });

    const onNudge = () => void refresh();
    const socket = getSocket();
    socket.on(SOCKET_EVENTS.NOTIFICATION, onNudge);

    return () => {
      clearInterval(interval);
      appStateSub.remove();
      socket.off(SOCKET_EVENTS.NOTIFICATION, onNudge);
    };
  }, [status, refresh]);

  return (
    <NotificationsContext.Provider
      value={{ items, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return ctx;
}
