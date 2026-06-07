import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  radius,
  spacing,
  useI18n,
  localizeNumber,
  type StatusBadgeTone,
  type StringKey,
} from "@ubts/shared";
import type { ActiveTrip } from "@ubts/shared";

type StatusMeta = {
  tone: StatusBadgeTone;
  labelKey: StringKey;
  withDot: boolean;
};

function statusMeta(trip: ActiveTrip): StatusMeta {
  const status = trip.status;
  if (status === "RUNNING") {
    return { tone: "live", labelKey: "badge.live", withDot: true };
  }
  if (status === "PRE_TRIP") {
    return { tone: "preTrip", labelKey: "badge.preTrip", withDot: true };
  }
  if (status === "ENDED") {
    return { tone: "ended", labelKey: "badge.ended", withDot: false };
  }
  return { tone: "muted", labelKey: "badge.planned", withDot: false };
}

export function TripCard({
  trip,
  etaMinutes,
  nextStopName,
  onTrack,
}: {
  trip: ActiveTrip;
  etaMinutes?: number | null;
  nextStopName?: string | null;
  onTrack: () => void;
}) {
  const { t, locale } = useI18n();
  const meta = statusMeta(trip);
  const isRunning = trip.status === "RUNNING";

  const subTitle =
    nextStopName && isRunning
      ? `${t("tripSheet.toStop", { stop: nextStopName })}`
      : trip.driverName
        ? trip.driverName
        : t("today.driverNotAssigned");

  const etaText =
    isRunning && etaMinutes != null && etaMinutes >= 0
      ? `${localizeNumber(etaMinutes, locale)} ${t("common.min")}`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <View style={styles.tagRow}>
            <View style={styles.busPill}>
              <Icon name="bus-outline" size={11} color={colors.mutedForeground} />
              <Text variant="caption" color={colors.mutedForeground}>
                {trip.busLabel ?? "Bus"}
              </Text>
            </View>
            <StatusBadge
              tone={meta.tone}
              label={t(meta.labelKey)}
              withDot={meta.withDot}
            />
          </View>
          <Text
            variant="subtitle"
            color={colors.foreground}
            numberOfLines={2}
            style={styles.routeName}
          >
            {trip.routeName ?? "Route"}
          </Text>
          <Text
            variant="caption"
            color={colors.mutedForeground}
            numberOfLines={1}
            style={styles.subtitle}
          >
            {subTitle}
          </Text>
        </View>

        {etaText ? (
          <View style={styles.etaBlock}>
            <Text variant="display" color={colors.primary} tabular>
              {etaText.split(" ")[0]}
            </Text>
            <Text variant="caption" color={colors.mutedForeground}>
              {etaText.split(" ").slice(1).join(" ")}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onTrack}
        style={({ pressed }) => [
          styles.cta,
          pressed && styles.ctaPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("home.liveTrack")}
      >
        <Icon name="navigate" size={16} color={colors.primaryForeground} />
        <Text variant="label" color={colors.primaryForeground}>
          {t("home.liveTrack")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  tagRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexWrap: "wrap" },
  busPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
  },
  routeName: { marginTop: 4 },
  subtitle: { marginTop: 2 },
  etaBlock: { alignItems: "flex-end", minWidth: 64 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaPressed: { backgroundColor: colors.primaryActive },
});
