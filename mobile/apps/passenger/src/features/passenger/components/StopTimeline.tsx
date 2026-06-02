import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, Icon, colors, spacing, radius, useI18n } from "@ubts/shared";
import type { RouteStop } from "@ubts/shared";

interface StopTimelineProps {
  stops: RouteStop[];
  nextStopName?: string | null;
  routeId?: string | null;
  isSubscribed?: (stopId: string) => boolean;
  onToggleSubscription?: (stopId: string, stopName: string) => void;
  isDestination?: (stopId: string) => boolean;
  onToggleDestination?: (stopId: string, stopName: string) => void;
}

type Phase = "passed" | "current" | "upcoming";

/** Vertical metro-line itinerary: passed stops dim, the next stop is accented. */
export function StopTimeline({
  stops,
  nextStopName,
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

  if (!stops.length) return null;

  return (
    <View style={styles.container}>
      {stops.map((stop, index) => {
        const phase: Phase =
          nextOrder == null
            ? "upcoming"
            : stop.order < nextOrder
              ? "passed"
              : stop.order === nextOrder
                ? "current"
                : "upcoming";
        const isLast = index === stops.length - 1;
        const dest = isDestination?.(stop.id) ?? false;
        return (
          <View key={stop.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  phase === "passed" && styles.nodePassed,
                  phase === "current" && styles.nodeCurrent,
                  dest && styles.nodeDestination,
                ]}
              />
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
                      variant={phase === "current" ? "label" : "body"}
                      color={
                        phase === "passed"
                          ? colors.faintForeground
                          : phase === "current"
                            ? colors.primary
                            : colors.foreground
                      }
                    >
                      {stop.name}
                    </Text>
                    {dest ? (
                      <View style={styles.destPill}>
                        <Icon
                          name="flag"
                          size={10}
                          color={colors.primaryForeground}
                        />
                        <Text variant="caption" color={colors.primaryForeground}>
                          {t("destination.chip")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {phase === "current" && (
                    <Text variant="caption" color={colors.mutedForeground}>
                      Next stop
                    </Text>
                  )}
                </View>
                {onToggleDestination && phase !== "passed" ? (
                  <Pressable
                    onPress={() => onToggleDestination(stop.id, stop.name)}
                    hitSlop={10}
                    style={[
                      styles.bell,
                      dest && styles.destActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: dest }}
                    accessibilityLabel={
                      dest ? t("destination.clear") : t("destination.set")
                    }
                  >
                    <Icon
                      name={dest ? "flag" : "flag-outline"}
                      size={16}
                      color={dest ? colors.primary : colors.mutedForeground}
                    />
                  </Pressable>
                ) : null}
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

const NODE = 14;

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
    marginTop: 2,
  },
  nodePassed: { borderColor: colors.faintForeground, opacity: 0.6 },
  nodeCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
  connectorPassed: { backgroundColor: colors.faintForeground, opacity: 0.5 },
  labelWrap: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  destPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primarySoft,
  },
});
