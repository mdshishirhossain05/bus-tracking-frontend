import { api } from "@/lib/api/axios";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
}

function unwrap(data: unknown): NotificationsState {
  const root = (data ?? {}) as Record<string, unknown>;
  const payload = (root.data ?? root) as Record<string, unknown>;
  const items = Array.isArray(payload.items)
    ? (payload.items as AppNotification[])
    : [];
  return { items, unreadCount: Number(payload.unreadCount ?? 0) };
}

export async function getNotifications(): Promise<NotificationsState> {
  const res = await api.get("/notifications");
  return unwrap(res.data);
}

export async function markAllNotificationsRead(): Promise<NotificationsState> {
  const res = await api.post("/notifications/read-all");
  return unwrap(res.data);
}

export async function markNotificationRead(
  id: string,
): Promise<NotificationsState> {
  const res = await api.post(`/notifications/${id}/read`);
  return unwrap(res.data);
}
