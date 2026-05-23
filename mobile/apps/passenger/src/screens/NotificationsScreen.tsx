import React, { useEffect } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  ScreenHeader,
  EmptyState,
  colors,
  spacing,
  radius,
  useNotifications,
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

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !item.isRead && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.dotCol}>
        {!item.isRead ? <View style={styles.dot} /> : null}
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
        onBack={goBack}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={() => void markAllRead()} hitSlop={8}>
              <Text variant="caption" color={colors.primary}>
                Mark all read
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  unread: { borderColor: colors.ring, backgroundColor: colors.muted },
  pressed: { opacity: 0.7 },
  dotCol: { width: 12, paddingTop: 6, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  body: { flex: 1, gap: 2 },
  bodyText: { marginBottom: 2 },
});
