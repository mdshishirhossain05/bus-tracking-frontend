import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import * as Notifications from "expo-notifications";
import {
  Icon,
  Text,
  colors,
  radius,
  spacing,
  useT,
  type IconName,
} from "@ubts/shared";

type PermissionView = "granted" | "denied" | "askable" | "loading";

async function readStatus(): Promise<PermissionView> {
  try {
    const res = await Notifications.getPermissionsAsync();
    if (res.granted) return "granted";
    if (res.canAskAgain) return "askable";
    return "denied";
  } catch {
    return "askable";
  }
}

/**
 * Surfaces the OS-level notification permission status so users know whether
 * push will actually reach them — separate from the in-app master switch.
 */
export function NotificationPermissionCard() {
  const t = useT();
  const [view, setView] = useState<PermissionView>("loading");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setView(await readStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (view === "askable") {
        await Notifications.requestPermissionsAsync();
        await refresh();
      } else if (view === "denied") {
        await Linking.openSettings();
      }
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, view]);

  if (view === "loading") {
    return null;
  }

  const meta: {
    icon: IconName;
    iconBg: string;
    iconColor: string;
    title: string;
    body: string;
    action: string | null;
  } =
    view === "granted"
      ? {
          icon: "checkmark-circle",
          iconBg: "rgba(34, 197, 94, 0.16)",
          iconColor: colors.success,
          title: t("notifPerm.granted"),
          body: t("notifPerm.grantedBody"),
          action: null,
        }
      : view === "askable"
        ? {
            icon: "notifications-outline",
            iconBg: "rgba(59, 130, 246, 0.16)",
            iconColor: colors.primary,
            title: t("notifPerm.askable"),
            body: t("notifPerm.askableBody"),
            action: t("notifPerm.allow"),
          }
        : {
            icon: "alert-circle",
            iconBg: "rgba(239, 68, 68, 0.16)",
            iconColor: colors.danger,
            title: t("notifPerm.denied"),
            body: t("notifPerm.deniedBody"),
            action: t("notifPerm.openSettings"),
          };

  const body = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: meta.iconBg }]}>
        <Icon name={meta.icon} size={18} color={meta.iconColor} />
      </View>
      <View style={styles.flex}>
        <Text variant="label" color={colors.foreground}>
          {meta.title}
        </Text>
        <Text variant="caption" color={colors.mutedForeground}>
          {meta.body}
        </Text>
      </View>
      {meta.action ? (
        <View style={styles.actionWrap}>
          <Text variant="caption" color={colors.primary}>
            {meta.action}
          </Text>
          <Icon
            name="chevron-forward"
            size={14}
            color={colors.mutedForeground}
          />
        </View>
      ) : null}
    </View>
  );

  if (!meta.action) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        busy && styles.cardDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={meta.action}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardPressed: { opacity: 0.85 },
  cardDisabled: { opacity: 0.7 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 2 },
  actionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
