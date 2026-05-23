import { api, unwrap } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { NotificationList } from "../../types";

export async function listNotifications(): Promise<NotificationList> {
  const res = await api.get(API_ENDPOINTS.notifications.list);
  const data = unwrap<NotificationList>(res.data);
  return { items: data?.items ?? [], unreadCount: data?.unreadCount ?? 0 };
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post(API_ENDPOINTS.notifications.readAll);
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(API_ENDPOINTS.notifications.read(id));
}
