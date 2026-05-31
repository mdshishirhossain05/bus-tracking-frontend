import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Text } from "./Text";

export type StatusBadgeTone =
  | "live"
  | "preTrip"
  | "delayed"
  | "ended"
  | "stale"
  | "info"
  | "success"
  | "muted";

const TONE_STYLES: Record<
  StatusBadgeTone,
  { bg: string; fg: string; dot: string }
> = {
  live: {
    bg: "rgba(34, 197, 94, 0.16)",
    fg: colors.success,
    dot: colors.success,
  },
  preTrip: {
    bg: "rgba(59, 130, 246, 0.16)",
    fg: "#60a5fa",
    dot: "#60a5fa",
  },
  delayed: {
    bg: "rgba(245, 158, 11, 0.18)",
    fg: colors.warning,
    dot: colors.warning,
  },
  ended: {
    bg: colors.muted,
    fg: colors.mutedForeground,
    dot: colors.mutedForeground,
  },
  stale: {
    bg: "rgba(249, 115, 22, 0.16)",
    fg: "#fb923c",
    dot: "#fb923c",
  },
  info: {
    bg: "rgba(99, 102, 241, 0.16)",
    fg: "#a5b4fc",
    dot: "#a5b4fc",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.16)",
    fg: colors.success,
    dot: colors.success,
  },
  muted: {
    bg: colors.muted,
    fg: colors.mutedForeground,
    dot: colors.mutedForeground,
  },
};

interface StatusBadgeProps {
  tone: StatusBadgeTone;
  label: string;
  withDot?: boolean;
  style?: ViewStyle;
}

/**
 * Compact color-coded status pill — used to surface trip lifecycle, stream
 * health, and other categorical state at a glance. The optional pulsing dot
 * is for "live"-style statuses where the user benefits from a visual
 * heartbeat.
 */
export function StatusBadge({
  tone,
  label,
  withDot = false,
  style,
}: StatusBadgeProps) {
  const palette = TONE_STYLES[tone];
  return (
    <View
      style={[styles.badge, { backgroundColor: palette.bg }, style]}
    >
      {withDot ? (
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      ) : null}
      <Text variant="caption" color={palette.fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    letterSpacing: 0.6,
    fontWeight: "600",
  },
});
