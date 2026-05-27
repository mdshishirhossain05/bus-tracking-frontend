import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, Icon, colors, spacing } from "@ubts/shared";
import type { RouteStop } from "@ubts/shared";

export function DriverStopList({
  stops,
  nextIndex,
}: {
  stops: RouteStop[];
  nextIndex: number;
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.wrap}
      showsVerticalScrollIndicator={false}
    >
      {stops.map((s, i) => {
        const passed = nextIndex >= 0 && i < nextIndex;
        const isNext = i === nextIndex;
        const first = i === 0;
        const last = i === stops.length - 1;
        const dotBg = isNext
          ? colors.primary
          : passed
            ? colors.success
            : colors.background;
        const dotBorder = isNext
          ? colors.primary
          : passed
            ? colors.success
            : colors.faintForeground;
        return (
          <View key={s.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: first
                      ? "transparent"
                      : passed || isNext
                        ? colors.primary
                        : colors.muted,
                  },
                ]}
              />
              <View style={[styles.dot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
                {isNext ? (
                  <Icon name="bus" size={11} color={colors.primaryForeground} />
                ) : passed ? (
                  <Icon name="checkmark" size={10} color={colors.background} />
                ) : null}
              </View>
              <View
                style={[
                  styles.connector,
                  { backgroundColor: last ? "transparent" : passed ? colors.primary : colors.muted },
                ]}
              />
            </View>
            <View style={styles.body}>
              <Text
                variant={isNext ? "label" : "body"}
                color={passed ? colors.mutedForeground : colors.foreground}
              >
                {s.name}
              </Text>
              <Text
                variant="caption"
                color={isNext ? colors.primary : colors.faintForeground}
              >
                {isNext ? "Next stop" : passed ? "Done" : "Upcoming"}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  row: { flexDirection: "row", alignItems: "stretch", gap: spacing.md },
  rail: { width: 24, alignItems: "center" },
  connector: { flex: 1, width: 2, minHeight: 10 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, paddingVertical: spacing.sm, gap: 1 },
});
