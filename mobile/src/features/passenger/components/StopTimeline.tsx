import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../../ui/Text";
import { colors, spacing } from "../../../theme/tokens";
import type { RouteStop } from "../../../types";

interface StopTimelineProps {
  stops: RouteStop[];
  nextStopName?: string | null;
}

type Phase = "passed" | "current" | "upcoming";

/** Vertical metro-line itinerary: passed stops dim, the next stop is accented. */
export function StopTimeline({ stops, nextStopName }: StopTimelineProps) {
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
        return (
          <View key={stop.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  phase === "passed" && styles.nodePassed,
                  phase === "current" && styles.nodeCurrent,
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
              {phase === "current" && (
                <Text variant="caption" color={colors.mutedForeground}>
                  Next stop
                </Text>
              )}
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
});
