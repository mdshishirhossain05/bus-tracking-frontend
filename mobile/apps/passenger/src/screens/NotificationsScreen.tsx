import React, { useEffect } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  ScreenHeader,
  EmptyState,
  Icon,
  colors,
  spacing,
  radius,
  useNotifications,
  type IconName,
} from "@ubts/shared";
import type { NotificationItem } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function iconForType(type: string): IconName {
  switch (type) {
    case "STOP_ARRIVAL":
      return "bus";
    case "TRIP_STARTED":
      return "play";
    case "TRIP_ENDED":
      return "flag";
    default:
      return "notifications";
  }
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const unread = !item.isRead;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.leadIcon, unread && styles.leadIconUnread]}>
        <Icon
          name={iconForType(item.type)}
          size={18}
          color={unread ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={styles.body}>
        <Text variant="label" color={colors.foreground}>
          {item.title}
        </Text>
        <Text variant="caption" color={colors.mutedForeground} style={styles.bodyText}>
          {item.body}
        </Text>
        <Text variant="caption" color={colors.faintForeground}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
      {unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { goBack } = useNav();
  const { items, loading, refresh, markRead, markAllRead, unreadCount } =
    useNotifications();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        onBack={goBack}
        right={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllRead()}
              hitSlop={8}
              style={styles.markAll}
            >
              <Icon name="checkmark-done" size={16} color={colors.primary} />
              <Text variant="caption" color={colors.primary}>
                Read all
              </Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length ? styles.list : styles.emptyWrap}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            subtitle="Arrival alerts for your favorite routes will appear here."
          />
        }
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => void markRead(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flexGrow: 1 },
  markAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  leadIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  leadIconUnread: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.7 },
  body: { flex: 1, gap: 2 },
  bodyText: { marginBottom: 2 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
