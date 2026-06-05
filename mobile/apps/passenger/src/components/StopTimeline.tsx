import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, Icon, colors, spacing } from "@ubts/shared";
import type { RouteStop } from "@ubts/shared";

interface Props {
  stops: RouteStop[];
  busIndex: number | null;
  myIndex: number;
  etaMin: number | null;
}

export function StopTimeline({ stops, busIndex, myIndex, etaMin }: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.wrap}
      showsVerticalScrollIndicator={false}
    >
      {stops.map((s, i) => {
        const passed = busIndex != null && i < busIndex;
        const isBusNext = busIndex != null && i === busIndex;
        const isMine = i === myIndex;
        const first = i === 0;
        const last = i === stops.length - 1;

        const dotBg = isBusNext
          ? colors.primary
          : passed
            ? colors.success
            : colors.background;
        const dotBorder = isMine
          ? colors.warning
          : isBusNext
            ? colors.primary
            : passed
              ? colors.success
              : colors.faintForeground;
        const lineAbove = passed || isBusNext ? colors.primary : colors.muted;
        const lineBelow = passed ? colors.primary : colors.muted;

        const subtitle = isMine
          ? etaMin != null
            ? `Your stop · ~${etaMin} min`
            : "Your stop"
          : isBusNext
            ? "Bus arriving here"
            : passed
              ? "Passed"
              : "Upcoming";
        const subtitleColor = isMine
          ? colors.warning
          : isBusNext
            ? colors.primary
            : colors.faintForeground;

        return (
          <View key={s.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.connector,
                  styles.connectorTop,
                  { backgroundColor: first ? "transparent" : lineAbove },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dotBg, borderColor: dotBorder, borderWidth: isMine ? 3 : 2 },
                ]}
              >
                {isBusNext ? (
                  <Icon name="bus" size={11} color={colors.primaryForeground} />
                ) : passed ? (
                  <Icon name="checkmark" size={10} color={colors.background} />
                ) : null}
              </View>
              <View
                style={[
                  styles.connector,
                  styles.connectorBottom,
                  { backgroundColor: last ? "transparent" : lineBelow },
                ]}
              />
            </View>
            <View style={styles.body}>
              <Text
                variant={isMine ? "label" : "body"}
                color={passed ? colors.mutedForeground : colors.foreground}
              >
                {s.name}
              </Text>
              <Text variant="caption" color={subtitleColor}>
                {subtitle}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: "row", alignItems: "stretch", gap: spacing.md },
  rail: { width: 24, alignItems: "center" },
  // Fixed-height top connector keeps the dot near the top of each row so
  // it lines up with the first line of the stop name (rather than the
  // vertical centre of a multi-line body block).
  connector: { width: 2, minHeight: 10 },
  connectorTop: { height: 10 },
  connectorBottom: { flex: 1 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, paddingTop: 6, paddingBottom: spacing.sm, gap: 1 },
});
