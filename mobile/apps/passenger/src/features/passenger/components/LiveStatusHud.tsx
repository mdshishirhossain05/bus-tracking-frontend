import React from "react";
import { StyleSheet, View } from "react-native";
import {
  GlassSurface,
  Icon,
  Text,
  colors,
  localizeNumber,
  spacing,
  useI18n,
} from "@ubts/shared";
import type { LiveBusLocation, TripEta } from "@ubts/shared";

interface LiveStatusHudProps {
  /** Live bus state for the selected trip, or null before the first fix. */
  live: LiveBusLocation | null;
  /** ETA payload (next stop + minutes), or null. */
  eta: TripEta | null;
  /** True only while the trip is actually RUNNING (not pre-trip / ended). */
  isRunning: boolean;
}

/**
 * On-map heads-up display.
 *
 * The single most important surface in the whole passenger app: the card
 * a rider glances at on the live map. It shows — without the rider having
 * to drag the bottom sheet open —
 *
 *   • the NEXT STOP the bus is heading to,
 *   • the ETA in minutes to that stop, and
 *   • the bus's current SPEED (or a "Stopped" pill when stationary).
 *
 * It floats top-centre under the connection pill, is non-interactive
 * (pointerEvents handled by the parent overlay), and only appears while
 * the trip is RUNNING with a live position — so it never shows stale or
 * pre-trip noise. All copy is bilingual via i18n; numbers are localised
 * so Bengali users see Bengali digits.
 */
export function LiveStatusHud({ live, eta, isRunning }: LiveStatusHudProps) {
  const { t, locale } = useI18n();

  if (!isRunning || !live) return null;

  const finalReached = eta?.finalStopReached === true;

  // Speed: prefer the server's smoothed display speed; treat <3 km/h or
  // the explicit stationary flag as "Stopped".
  const rawSpeed =
    live.displaySpeedKmh ?? live.filteredSpeedKmh ?? live.speed ?? null;
  const stationary =
    live.isStationary === true || (rawSpeed != null && rawSpeed < 3);
  const speedValue =
    rawSpeed != null && rawSpeed >= 0 ? Math.round(rawSpeed) : null;

  const nextStop = eta?.nextStopName ?? null;
  const etaMinutes =
    eta?.etaMinutes != null && eta.etaMinutes >= 0 ? eta.etaMinutes : null;

  // Headline: "Arriving" + ETA, or "Arrived" at the final stop.
  const headline = finalReached
    ? t("tripSheet.arrived")
    : etaMinutes != null
      ? t("hud.arrivingIn")
      : t("hud.enRoute");

  return (
    <View style={styles.wrap} pointerEvents="none">
      <GlassSurface rounded="lg" style={styles.card}>
        {/* Left block — next stop + ETA */}
        <View style={styles.left}>
          <View style={styles.labelRow}>
            <View style={styles.liveDot} />
            <Text
              variant="caption"
              color={colors.mutedForeground}
              style={styles.label}
            >
              {nextStop ? t("hud.nextStop") : t("hud.live")}
            </Text>
          </View>

          {nextStop ? (
            <Text variant="subtitle" color={colors.foreground} numberOfLines={1}>
              {nextStop}
            </Text>
          ) : (
            <Text variant="subtitle" color={colors.foreground}>
              {t("hud.tracking")}
            </Text>
          )}

          <View style={styles.etaRow}>
            <Text variant="caption" color={colors.mutedForeground}>
              {headline}
            </Text>
            {!finalReached && etaMinutes != null ? (
              <Text variant="label" color={colors.primary} tabular>
                {" "}
                {localizeNumber(etaMinutes, locale)} {t("common.min")}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Right block — speed gauge */}
        <View style={styles.right}>
          {stationary ? (
            <>
              <Icon name="pause" size={18} color={colors.warning} />
              <Text variant="caption" color={colors.warning} style={styles.speedLabel}>
                {t("hud.stopped")}
              </Text>
            </>
          ) : (
            <>
              <Text variant="title" color={colors.foreground} tabular>
                {speedValue != null ? localizeNumber(speedValue, locale) : "—"}
              </Text>
              <Text variant="caption" color={colors.mutedForeground} style={styles.speedLabel}>
                {t("common.kmh")}
              </Text>
            </>
          )}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minWidth: 280,
    maxWidth: 460,
  },
  left: { flex: 1, gap: 2 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  label: { letterSpacing: 1, textTransform: "uppercase" },
  etaRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  right: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg,
  },
  speedLabel: { letterSpacing: 0.5, marginTop: -2 },
});
