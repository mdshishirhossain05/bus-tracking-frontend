import { api, unwrap } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type {
  NotificationList,
  NotificationPreferences,
  StopSubscription,
} from "../../types";

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

export async function registerPushToken(
  token: string,
  platform?: string,
  deviceName?: string,
): Promise<void> {
  await api.post(API_ENDPOINTS.notifications.pushToken, {
    token,
    platform,
    deviceName,
  });
}

export async function removePushToken(token: string): Promise<void> {
  await api.delete(API_ENDPOINTS.notifications.pushToken, { data: { token } });
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await api.get(API_ENDPOINTS.notifications.preferences);
  const data = unwrap<NotificationPreferences>(res.data);
  return {
    notificationsEnabled: data?.notificationsEnabled ?? true,
    quietHoursStartMin: data?.quietHoursStartMin ?? null,
    quietHoursEndMin: data?.quietHoursEndMin ?? null,
  };
}

export async function updateNotificationPreferences(
  input: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await api.put(API_ENDPOINTS.notifications.preferences, input);
  const data = unwrap<NotificationPreferences>(res.data);
  return {
    notificationsEnabled: data?.notificationsEnabled ?? true,
    quietHoursStartMin: data?.quietHoursStartMin ?? null,
    quietHoursEndMin: data?.quietHoursEndMin ?? null,
  };
}

export async function listStopSubscriptions(): Promise<StopSubscription[]> {
  const res = await api.get(API_ENDPOINTS.notifications.subscriptions);
  const data = unwrap<{ items: StopSubscription[] }>(res.data);
  return data?.items ?? [];
}

export async function upsertStopSubscription(input: {
  stopId: string;
  routeId: string;
  leadTimeMinutes?: number;
}): Promise<StopSubscription> {
  const res = await api.post(
    API_ENDPOINTS.notifications.subscriptions,
    input,
  );
  const data = unwrap<StopSubscription>(res.data);
  if (!data) {
    throw new Error("Subscription create returned an empty payload");
  }
  return data;
}

export async function toggleStopSubscription(
  routeId: string,
  stopId: string,
  enabled: boolean,
): Promise<StopSubscription> {
  const res = await api.put(
    API_ENDPOINTS.notifications.subscription(routeId, stopId),
    { enabled },
  );
  const data = unwrap<StopSubscription>(res.data);
  if (!data) {
    throw new Error("Subscription toggle returned an empty payload");
  }
  return data;
}

export async function deleteStopSubscription(
  routeId: string,
  stopId: string,
): Promise<void> {
  await api.delete(API_ENDPOINTS.notifications.subscription(routeId, stopId));
}
