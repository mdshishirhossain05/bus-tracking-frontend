import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, Icon, colors, spacing } from "@ubts/shared";
import type { RouteLiveBus } from "@ubts/shared";
import { sourceMeta, freshnessLabel } from "../features/journey/journey";

export function SourceChip({ bus }: { bus: RouteLiveBus }) {
  const meta = sourceMeta(bus);
  const tone = meta.stale ? colors.warning : colors.success;
  const fresh = freshnessLabel(bus.updatedAt);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Icon
        name={meta.isGps ? "hardware-chip-outline" : "phone-portrait-outline"}
        size={13}
        color={colors.mutedForeground}
      />
      <Text variant="caption" color={colors.mutedForeground}>
        {meta.label}
        {meta.stale ? " · signal delayed" : ""}
        {fresh ? ` · ${fresh}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
