import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Text,
  Icon,
  colors,
  radius,
  spacing,
  useAuth,
  useI18n,
  useReduceMotion,
  type IconName,
  type StringKey,
} from "@ubts/shared";
import type { PassengerScreen } from "../navigation/NavigationContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DRAWER_WIDTH = Math.min(320, Math.round(SCREEN_WIDTH * 0.82));

type MenuItem = {
  screen: PassengerScreen | "live";
  icon: IconName;
  labelKey: StringKey;
  badge?: number;
};

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (screen: PassengerScreen) => void;
  unreadCount?: number;
}

/**
 * Slide-in nav drawer. Opens from the left, covers ~82% of the screen,
 * tap-outside-to-close, full keyboard-/screen-reader-accessible.
 *
 * Each entry maps to a destination in the overlay-based navigation
 * model. "live" is treated specially — it's the persistent base screen
 * under everything, so selecting it just closes the drawer.
 */
export function HamburgerMenu({
  open,
  onClose,
  onNavigate,
  unreadCount = 0,
}: HamburgerMenuProps) {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const reduceMotion = useReduceMotion();

  const slide = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, reduceMotion, slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });
  const backdropOpacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  const items: MenuItem[] = [
    { screen: "live", icon: "navigate-circle-outline", labelKey: "menu.live" },
    {
      screen: "todaysSchedules",
      icon: "calendar-outline",
      labelKey: "menu.today",
    },
    { screen: "routes", icon: "map-outline", labelKey: "menu.routes" },
    {
      screen: "notifications",
      icon: "notifications-outline",
      labelKey: "menu.notifications",
      badge: unreadCount,
    },
    { screen: "history", icon: "time-outline", labelKey: "menu.history" },
    {
      screen: "notificationPreferences",
      icon: "settings-outline",
      labelKey: "menu.preferences",
    },
    {
      screen: "profile",
      icon: "person-outline",
      labelKey: "menu.profile",
    },
  ];

  const handleSelect = (screen: MenuItem["screen"]) => {
    void Haptics.selectionAsync();
    onClose();
    // Close animation finishes in ~220ms; for "live" we just close, no
    // navigation needed. For overlays we kick navigation immediately so
    // it lines up with the drawer slide-out.
    if (screen !== "live") {
      onNavigate(screen);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
        pointerEvents={open ? "auto" : "none"}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t("common.close")}
          accessibilityRole="button"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX }], width: DRAWER_WIDTH },
        ]}
      >
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Icon name="person" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text variant="subtitle" color={colors.foreground} numberOfLines={1}>
                {user?.fullName ?? "UniBus"}
              </Text>
              {user?.email ? (
                <Text
                  variant="caption"
                  color={colors.mutedForeground}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.screen}
                onPress={() => handleSelect(item.screen)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t(item.labelKey)}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  color={colors.mutedForeground}
                />
                <Text variant="label" color={colors.foreground} style={styles.flex}>
                  {t(item.labelKey)}
                </Text>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text variant="caption" color={colors.primaryForeground}>
                      {item.badge > 99 ? "99+" : String(item.badge)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                onClose();
                void signOut();
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("common.signOut")}
            >
              <Icon name="log-out-outline" size={20} color={colors.danger} />
              <Text variant="label" color={colors.danger} style={styles.flex}>
                {t("common.signOut")}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "#000" },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  list: { flex: 1, paddingVertical: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: { backgroundColor: colors.muted },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
