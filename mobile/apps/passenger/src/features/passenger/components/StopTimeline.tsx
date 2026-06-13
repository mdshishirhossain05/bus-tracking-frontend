import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  spacing,
  radius,
  useI18n,
} from "@ubts/shared";
import type { RouteStop } from "@ubts/shared";

interface StopTimelineProps {
  stops: RouteStop[];
  nextStopName?: string | null;
  /**
   * Id of the stop the bus is currently dwelling at (within ~50m and
   * stationary). When provided, that stop renders with a primary
   * "Bus here" badge and is treated as the live current location; the
   * stops before it become "Passed" automatically.
   */
  currentStopId?: string | null;
  routeId?: string | null;
  isSubscribed?: (stopId: string) => boolean;
  onToggleSubscription?: (stopId: string, stopName: string) => void;
  isDestination?: (stopId: string) => boolean;
  onToggleDestination?: (stopId: string, stopName: string) => void;
}

type Phase = "passed" | "at" | "next" | "upcoming";

/**
 * Vertical metro-line itinerary for the live trip sheet.
 *
 * Four phases, derived from the live bus state:
 * - Passed: stops the bus has already cleared — green node + check,
 *   muted-green text, "Passed" badge.
 * - At: the stop the bus is currently dwelling at (low speed + within
 *   the arrival radius). Primary-filled node, highlighted name, "Bus
 *   here" badge with a live dot.
 * - Next: the stop the bus is heading toward (server-reported next
 *   stop). Primary-outlined node, "Next" badge.
 * - Upcoming: empty node, normal name.
 *
 * Destination (the stop the passenger flagged as their own) overrides
 * the badge with "Your stop" but keeps the phase styling underneath.
 */
export function StopTimeline({
  stops,
  nextStopName,
  currentStopId,
  routeId,
  isSubscribed,
  onToggleSubscription,
  isDestination,
  onToggleDestination,
}: StopTimelineProps) {
  const { t } = useI18n();
  const nextOrder = useMemo(() => {
    if (!nextStopName) return null;
    const match = stops.find((s) => s.name === nextStopName);
    return match?.order ?? null;
  }, [stops, nextStopName]);
  const atOrder = useMemo(() => {
    if (!currentStopId) return null;
    const match = stops.find((s) => s.id === currentStopId);
    return match?.order ?? null;
  }, [stops, currentStopId]);

  if (!stops.length) return null;

  return (
    <View style={styles.container}>
      {stops.map((stop, index) => {
        // Phase resolution. "at" wins over "next" — a bus dwelling at
        // a stop is more informative than a stale "next" hint.
        let phase: Phase = "upcoming";
        if (atOrder != null) {
          if (stop.order < atOrder) phase = "passed";
          else if (stop.order === atOrder) phase = "at";
          else if (nextOrder != null && stop.order === nextOrder) phase = "next";
          else phase = "upcoming";
        } else if (nextOrder != null) {
          if (stop.order < nextOrder) phase = "passed";
          else if (stop.order === nextOrder) phase = "next";
          else phase = "upcoming";
        }

        const isLast = index === stops.length - 1;
        const dest = isDestination?.(stop.id) ?? false;

        const nameColor = dest
          ? colors.warning
          : phase === "at" || phase === "next"
            ? colors.primary
            : phase === "passed"
              ? colors.success
              : colors.foreground;

        return (
          <View key={stop.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  phase === "passed" && styles.nodePassed,
                  phase === "next" && styles.nodeNext,
                  phase === "at" && styles.nodeAt,
                  dest && styles.nodeDestination,
                ]}
              >
                {phase === "passed" ? (
                  <Icon
                    name="checkmark"
                    size={10}
                    color={colors.primaryForeground}
                  />
                ) : null}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    phase === "passed" && styles.connectorPassed,
                  ]}
                />
              )}
            </View>
            <View style={styles.labelWrap}>
              <View style={styles.labelRow}>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text
                      variant={
                        phase === "at" || phase === "next" || dest
                          ? "label"
                          : "body"
                      }
                      color={nameColor}
                    >
                      {stop.name}
                    </Text>
                  </View>
                </View>

                {/* Status / destination badges */}
                {dest ? (
                  <StatusBadge
                    tone="delayed"
                    label={t("stop.badge.destination")}
                    withDot
                  />
                ) : phase === "at" ? (
                  <StatusBadge
                    tone="live"
                    label={t("stop.badge.here")}
                    withDot
                  />
                ) : phase === "next" ? (
                  <StatusBadge
                    tone="live"
                    label={t("stop.badge.now")}
                    withDot
                  />
                ) : phase === "passed" ? (
                  <StatusBadge
                    tone="success"
                    label={t("stop.badge.passed")}
                    withDot={false}
                  />
                ) : null}

                {/* Destination toggle (flag) */}
                {onToggleDestination && phase !== "passed" ? (
                  <Pressable
                    onPress={() => onToggleDestination(stop.id, stop.name)}
                    hitSlop={10}
                    style={[styles.bell, dest && styles.destActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dest }}
                    accessibilityLabel={
                      dest ? t("destination.clear") : t("destination.set")
                    }
                  >
                    <Icon
                      name={dest ? "flag" : "flag-outline"}
                      size={16}
                      color={dest ? colors.warning : colors.mutedForeground}
                    />
                  </Pressable>
                ) : null}

                {/* Stop subscription toggle (bell) */}
                {routeId && onToggleSubscription && phase !== "passed" ? (
                  <Pressable
                    onPress={() => onToggleSubscription(stop.id, stop.name)}
                    hitSlop={10}
                    style={[
                      styles.bell,
                      isSubscribed?.(stop.id) && styles.bellActive,
                    ]}
                  >
                    <Icon
                      name={
                        isSubscribed?.(stop.id)
                          ? "notifications"
                          : "notifications-outline"
                      }
                      size={16}
                      color={
                        isSubscribed?.(stop.id)
                          ? colors.primary
                          : colors.mutedForeground
                      }
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 18;

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm },
  row: { flexDirection: "row", minHeight: 44 },
  rail: { width: NODE, alignItems: "center" },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    borderColor: colors.mutedForeground,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    // Bumped from 2 → 5 so the dot centres on the first line of the
    // stop name.
    marginTop: 5,
  },
  nodePassed: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  // Bus dwelling at this stop right now — solid primary fill, larger
  // ring to make it pop as the "you are here" beacon on the timeline.
  nodeAt: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  // Next stop the bus is heading toward — primary outline (hollow) so
  // it reads as "ahead of the bus" not "the bus".
  nodeNext: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
    borderWidth: 3,
  },
  nodeDestination: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  connectorPassed: { backgroundColor: colors.success },
  labelWrap: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  flex: { flex: 1 },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },
  bellActive: {
    backgroundColor: colors.primarySoft,
  },
  destActive: {
    backgroundColor: "rgba(245, 158, 11, 0.18)",
  },
});
