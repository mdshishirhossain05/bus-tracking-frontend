import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Icon,
  Text,
  colors,
  radius,
  spacing,
  localizeNumber,
  useI18n,
} from "@ubts/shared";
import type { LiveBusLocation } from "@ubts/shared";

/**
 * Tiered staleness messaging.
 *
 * The app already detects stale data passively (the bus marker fades).
 * This banner makes the situation explicit: "your bus's position is
 * outdated, here's how old, here's why it might be happening, and
 * here's what to do."
 *
 * Tiers (from time-since-last-update):
 *   MILD     >  60s    →  "Live updates paused"
 *   SERIOUS  > 180s    →  "Bus may be offline" (driver phone / GPS device hint)
 *   SEVERE   > 600s    →  "Bus location unavailable" (suggest refresh)
 */

const MILD_AFTER_MS = 60_000;
const SERIOUS_AFTER_MS = 180_000;
const SEVERE_AFTER_MS = 600_000;

type Tier = "fresh" | "mild" | "serious" | "severe";

function classify(ageMs: number): Tier {
  if (ageMs < MILD_AFTER_MS) return "fresh";
  if (ageMs < SERIOUS_AFTER_MS) return "mild";
  if (ageMs < SEVERE_AFTER_MS) return "serious";
  return "severe";
}

function useTier(updatedAt: string | null | undefined): {
  tier: Tier;
  ageMs: number;
} {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  const ageMs = updatedAt
    ? Date.now() - new Date(updatedAt).getTime()
    : Number.POSITIVE_INFINITY;
  // tick is a dep so the rerender every 15s actually fires
  void tick;
  return { tier: classify(ageMs), ageMs };
}

export function StaleDataBanner({
  liveState,
}: {
  liveState: LiveBusLocation | null;
}) {
  const { t, locale } = useI18n();
  const { tier, ageMs } = useTier(liveState?.updatedAt);

  if (!liveState || tier === "fresh") return null;

  const ageText = humanAge(ageMs, t, locale);

  const meta =
    tier === "mild"
      ? {
          tint: "rgba(245, 158, 11, 0.14)",
          border: "rgba(245, 158, 11, 0.4)",
          iconBg: "rgba(245, 158, 11, 0.18)",
          icon: "time-outline" as const,
          iconColor: colors.warning,
          title: t("stale.mild.title"),
          body: t("stale.mild.body", { n: ageText }),
        }
      : tier === "serious"
        ? {
            tint: "rgba(245, 158, 11, 0.22)",
            border: "rgba(245, 158, 11, 0.55)",
            iconBg: "rgba(245, 158, 11, 0.28)",
            icon: "warning-outline" as const,
            iconColor: colors.warning,
            title: t("stale.serious.title"),
            body: t("stale.serious.body", { n: ageText }),
          }
        : {
            tint: "rgba(239, 68, 68, 0.16)",
            border: "rgba(239, 68, 68, 0.45)",
            iconBg: "rgba(239, 68, 68, 0.22)",
            icon: "alert-circle-outline" as const,
            iconColor: colors.danger,
            title: t("stale.severe.title"),
            body: t("stale.severe.body", { n: ageText }),
          };

  // Source hint (driver phone vs hardware GPS) so the passenger knows
  // which side of the pipeline likely lost signal.
  const sourceHint = (() => {
    if (!liveState.source) return null;
    if (liveState.source.includes("DRIVER") || liveState.source === "PHONE") {
      return t("stale.source.phone", { n: ageText });
    }
    if (liveState.source.includes("DEVICE") || liveState.source === "GPS_DEVICE") {
      return t("stale.source.device", { n: ageText });
    }
    return null;
  })();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: meta.tint, borderColor: meta.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.iconBg }]}>
        <Icon name={meta.icon} size={18} color={meta.iconColor} />
      </View>
      <View style={styles.body}>
        <Text variant="label" color={colors.foreground}>
          {meta.title}
        </Text>
        <Text variant="caption" color={colors.mutedForeground}>
          {meta.body}
        </Text>
        {sourceHint ? (
          <Text variant="caption" color={colors.faintForeground} style={styles.source}>
            {sourceHint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function humanAge(
  ms: number,
  t: ReturnType<typeof useI18n>["t"],
  locale: ReturnType<typeof useI18n>["locale"],
): string {
  const sec = Math.round(ms / 1000);
  if (sec < 30) return t("stale.justNow");
  if (sec < 60) return t("stale.seconds", { n: localizeNumber(sec, locale) });
  const min = Math.round(sec / 60);
  if (min < 60) return t("stale.minutes", { n: localizeNumber(min, locale) });
  const hr = Math.round(min / 60);
  return t("stale.hours", { n: localizeNumber(hr, locale) });
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  source: { marginTop: 2 },
});
