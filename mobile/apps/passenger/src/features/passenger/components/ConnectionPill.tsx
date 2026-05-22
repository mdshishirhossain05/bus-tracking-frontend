import React from "react";
import { StyleSheet, View } from "react-native";
import { GlassSurface } from "@ubts/shared";
import { Text } from "@ubts/shared";
import { colors } from "@ubts/shared";
import type { ConnectionStatus } from "@ubts/shared";

const STATUS: Record<ConnectionStatus, { label: string; color: string }> = {
  connecting: { label: "Connecting", color: colors.warning },
  connected: { label: "Live", color: colors.success },
  reconnecting: { label: "Reconnecting", color: colors.warning },
  stale: { label: "Signal lost", color: colors.warning },
  disconnected: { label: "Offline", color: colors.faintForeground },
  error: { label: "Connection error", color: colors.danger },
};

export function ConnectionPill({ status }: { status: ConnectionStatus }) {
  const meta = STATUS[status];
  return (
    <GlassSurface rounded="pill" style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text variant="caption" color={colors.foreground}>
        {meta.label}
      </Text>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
