import React, { useEffect, useState } from "react";
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

const FRESH_FETCH_MS = 30_000;
const NEGATIVE_DEBOUNCE_MS = 6000;

/**
 * Truth signal: while REST polling is succeeding, show "Live" — the
 * underlying socket can be reconnecting in the background and that is
 * not the user's concern. Negative states are also debounced 6s so a
 * brief blip never flashes a scary "Connection error".
 */
export function ConnectionPill({
  status,
  lastFetchAt,
}: {
  status: ConnectionStatus;
  lastFetchAt?: string | null;
}) {
  const fetchAgeMs = lastFetchAt
    ? Date.now() - new Date(lastFetchAt).getTime()
    : Number.POSITIVE_INFINITY;
  const reachable = fetchAgeMs < FRESH_FETCH_MS;

  const isNegative =
    status === "disconnected" ||
    status === "error" ||
    status === "stale" ||
    status === "reconnecting";

  const [debouncedStatus, setDebouncedStatus] = useState(status);
  useEffect(() => {
    if (!isNegative) {
      setDebouncedStatus(status);
      return;
    }
    const id = setTimeout(() => setDebouncedStatus(status), NEGATIVE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [status, isNegative]);

  // While the REST layer is alive, present as "connected" — that's the
  // truth from the user's perspective.
  const effective: ConnectionStatus =
    reachable && isNegative ? "connected" : debouncedStatus;

  const meta = STATUS[effective];
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
