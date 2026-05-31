import React from "react";
import { StyleSheet, View } from "react-native";
import {
  GlassSurface,
  Text,
  Icon,
  colors,
  spacing,
  radius,
  type IconName,
} from "@ubts/shared";
import type { PreTripPhaseState } from "../hooks/usePassengerLiveTrip";

type Copy = {
  headline: string;
  detail: string;
  icon: IconName;
  iconTint: string;
  pulse: boolean;
};

function copyFor(phase: PreTripPhaseState): Copy {
  switch (phase.phase) {
    case "AT_DEPOT":
      return {
        headline: "Bus is parked at the depot",
        detail: "Waiting for departure. We'll show you the live location as soon as it starts moving.",
        icon: "bed-outline",
        iconTint: colors.mutedForeground,
        pulse: false,
      };
    case "APPROACHING_ORIGIN": {
      const dist = phase.distanceToOriginMeters;
      const detail =
        dist != null
          ? dist >= 1000
            ? `${(dist / 1000).toFixed(1)} km to the start point`
            : `${Math.max(50, Math.round(dist / 10) * 10)}m to the start point`
          : "On the way to the start point";
      return {
        headline: "Bus is on the way",
        detail,
        icon: "navigate-outline",
        iconTint: colors.primary,
        pulse: true,
      };
    }
    case "AT_ORIGIN":
      return {
        headline: "Bus has arrived at the start",
        detail: "Boarding soon — the trip will start any moment.",
        icon: "checkmark-circle-outline",
        iconTint: colors.success,
        pulse: true,
      };
  }
}

export function PreTripBanner({ phase }: { phase: PreTripPhaseState }) {
  const c = copyFor(phase);
  return (
    <GlassSurface style={styles.card}>
      <View
        style={[
          styles.iconWrap,
          c.pulse ? styles.iconPulse : null,
        ]}
      >
        <Icon name={c.icon} size={18} color={c.iconTint} />
      </View>
      <View style={styles.flex}>
        <Text variant="caption" color={colors.mutedForeground}>
          PRE-TRIP
        </Text>
        <Text variant="label" color={colors.foreground} numberOfLines={1}>
          {c.headline}
        </Text>
        <Text
          variant="caption"
          color={colors.mutedForeground}
          numberOfLines={2}
        >
          {c.detail}
        </Text>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPulse: {
    backgroundColor: colors.primarySoft,
  },
  flex: { flex: 1, gap: 2 },
});
