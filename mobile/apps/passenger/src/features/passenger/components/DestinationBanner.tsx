import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, Icon, colors, radius, spacing, useI18n } from "@ubts/shared";
import type { DestinationAlertState } from "../hooks/useDestinationStop";

interface DestinationBannerProps {
  alert: DestinationAlertState;
  onDismiss: () => void;
}

/**
 * Banner that appears when the passenger's destination stop is the
 * bus's next stop AND the bus is within ~2 minutes. Strong visual
 * cue + dismiss button. Auto-clears when the bus moves past the
 * destination — but a manual dismiss is always available so users
 * who've already deboarded can hide it immediately.
 */
export function DestinationBanner({ alert, onDismiss }: DestinationBannerProps) {
  const { t } = useI18n();
  if (alert.kind === "idle") return null;

  const isArrived = alert.kind === "arrived";

  return (
    <View
      style={[styles.banner, isArrived ? styles.bannerArrived : styles.bannerApproaching]}
      accessible
      accessibilityLiveRegion="assertive"
      accessibilityLabel={
        isArrived
          ? t("destination.atStopTitle", { stop: alert.stopName })
          : t("destination.approachingTitle")
      }
    >
      <View
        style={[
          styles.iconWrap,
          isArrived ? styles.iconArrived : styles.iconApproaching,
        ]}
      >
        <Icon
          name={isArrived ? "checkmark-circle" : "flag"}
          size={22}
          color={isArrived ? colors.success : colors.warning}
        />
      </View>
      <View style={styles.flex}>
        <Text variant="label" color={colors.foreground}>
          {isArrived
            ? t("destination.atStopTitle", { stop: alert.stopName })
            : t("destination.approachingTitle")}
        </Text>
        {!isArrived ? (
          <Text variant="caption" color={colors.mutedForeground} numberOfLines={2}>
            {t("destination.approachingBody", { stop: alert.stopName })}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.dismiss}
      >
        <Icon name="close" size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerApproaching: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  bannerArrived: {
    backgroundColor: "rgba(34, 197, 94, 0.14)",
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconApproaching: { backgroundColor: "rgba(245, 158, 11, 0.2)" },
  iconArrived: { backgroundColor: "rgba(34, 197, 94, 0.2)" },
  flex: { flex: 1, gap: 2 },
  dismiss: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
