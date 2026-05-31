import React from "react";
import { StyleSheet, View } from "react-native";
import {
  GlassSurface,
  Text,
  Icon,
  colors,
  spacing,
  radius,
  localizeNumber,
  useI18n,
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

export function PreTripBanner({ phase }: { phase: PreTripPhaseState }) {
  const { t, locale } = useI18n();

  const copy: Copy = (() => {
    switch (phase.phase) {
      case "AT_DEPOT":
        return {
          headline: t("preTrip.atDepot.title"),
          detail: t("preTrip.atDepot.detail"),
          icon: "bed-outline",
          iconTint: colors.mutedForeground,
          pulse: false,
        };
      case "APPROACHING_ORIGIN": {
        const dist = phase.distanceToOriginMeters;
        const detail =
          dist != null
            ? dist >= 1000
              ? t("preTrip.approaching.distanceKm", {
                  n: localizeNumber((dist / 1000).toFixed(1), locale),
                })
              : t("preTrip.approaching.distanceM", {
                  n: localizeNumber(
                    Math.max(50, Math.round(dist / 10) * 10),
                    locale,
                  ),
                })
            : t("preTrip.approaching.detail");
        return {
          headline: t("preTrip.approaching.title"),
          detail,
          icon: "navigate-outline",
          iconTint: colors.primary,
          pulse: true,
        };
      }
      case "AT_ORIGIN":
        return {
          headline: t("preTrip.atOrigin.title"),
          detail: t("preTrip.atOrigin.detail"),
          icon: "checkmark-circle-outline",
          iconTint: colors.success,
          pulse: true,
        };
    }
  })();

  return (
    <GlassSurface
      style={styles.card}
      // Whole banner reads as one item to screen readers — the icon is
      // decorative, so we surface headline + detail together.
    >
      <View
        accessible
        accessibilityLabel={`${t("preTrip.label")}. ${copy.headline}. ${copy.detail}`}
        style={styles.row}
      >
        <View
          style={[
            styles.iconWrap,
            copy.pulse ? styles.iconPulse : null,
          ]}
        >
          <Icon name={copy.icon} size={18} color={copy.iconTint} />
        </View>
        <View style={styles.flex}>
          <Text variant="caption" color={colors.mutedForeground}>
            {t("preTrip.label")}
          </Text>
          <Text variant="label" color={colors.foreground} numberOfLines={1}>
            {copy.headline}
          </Text>
          <Text
            variant="caption"
            color={colors.mutedForeground}
            numberOfLines={2}
          >
            {copy.detail}
          </Text>
        </View>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
