import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import {
  Icon,
  Text,
  colors,
  radius,
  spacing,
  useT,
} from "@ubts/shared";

const SEEN_KEY = "ubts.notif.primerSeen";

/**
 * Pre-OS-prompt explainer modal. Shown once after first sign-in. Tells
 * the user *why* the next system dialog matters before they tap
 * accept/deny on instinct. Industry pattern — typically lifts the
 * notification accept-rate from ~40% to ~75%.
 *
 * Channel + permission flow itself still lives in PushBootstrap. This
 * modal just teaches the user what to expect.
 */
export function NotificationPrimer() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(SEEN_KEY);
        if (seen === "1") return;
        const current = await Notifications.getPermissionsAsync();
        // Don't show the primer if the user has already decided either way
        // — they've granted, or they've explicitly denied. The primer is
        // only useful for the "not asked yet" state.
        if (current.granted) return;
        if (!current.canAskAgain) return;
        if (cancelled) return;
        setOpen(true);
      } catch {
        // SecureStore failure is non-fatal; we just stay quiet.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markSeen = async () => {
    try {
      await SecureStore.setItemAsync(SEEN_KEY, "1");
    } catch {
      // Best-effort.
    }
  };

  const accept = async () => {
    setOpen(false);
    await markSeen();
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Bus alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3b82f6",
          sound: "default",
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
      await Notifications.requestPermissionsAsync();
    } catch {
      // Permission API failure — user can still grant via settings.
    }
  };

  const dismiss = async () => {
    setOpen(false);
    await markSeen();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
          <Pressable onPress={() => undefined}>
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Icon name="notifications" size={32} color={colors.primary} />
              </View>
              <Text variant="title" color={colors.foreground} style={styles.title}>
                {t("notifPrimer.title")}
              </Text>
              <Text
                variant="body"
                color={colors.mutedForeground}
                style={styles.body}
              >
                {t("notifPrimer.body")}
              </Text>
              <Pressable
                onPress={accept}
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                ]}
              >
                <Text variant="label" color={colors.primaryForeground}>
                  {t("notifPrimer.allow")}
                </Text>
              </Pressable>
              <Pressable onPress={dismiss} hitSlop={10} style={styles.later}>
                <Text variant="caption" color={colors.mutedForeground}>
                  {t("notifPrimer.later")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    width: "100%",
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 400,
    alignSelf: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { textAlign: "center" },
  body: { textAlign: "center", marginTop: 4, marginBottom: spacing.lg },
  cta: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaPressed: { backgroundColor: colors.primaryActive },
  later: { paddingVertical: spacing.sm },
});
