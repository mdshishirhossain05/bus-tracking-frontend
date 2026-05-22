import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import {
  GlassSurface,
  Text,
  colors,
  radius,
  spacing,
  useAuth,
} from "@ubts/shared";
import { useDriverTrip } from "../hooks/useDriverTrip";
import { LiveIndicator } from "../components/LiveIndicator";

export function DriverHomeScreen() {
  useKeepAwake();
  const { user, signOut } = useAuth();
  const { loading, trip, streaming, busy, error, permissionDenied, lastFix, start, end } =
    useDriverTrip();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [streaming]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const updatedAgo =
    streaming && lastFix
      ? `${Math.max(0, Math.round((now - lastFix.at) / 1000))}s ago`
      : "—";
  const speed =
    streaming && lastFix?.speedKmh != null ? `${Math.round(lastFix.speedKmh)}` : "—";
  const accuracy =
    streaming && lastFix?.accuracyM != null
      ? `±${Math.round(lastFix.accuracyM)}m`
      : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <View>
          <Text variant="caption" color={colors.primary}>
            UNIBUS DRIVER
          </Text>
          <Text variant="subtitle" color={colors.foreground}>
            {user?.fullName ?? "Driver"}
          </Text>
        </View>
        <Pressable onPress={signOut} hitSlop={8}>
          <Text variant="label" color={colors.mutedForeground}>
            Sign out
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <GlassSurface style={styles.card}>
          <Text variant="label" color={colors.mutedForeground}>
            {trip ? trip.routeName ?? "Assigned route" : "No active trip"}
          </Text>
          <Text variant="title" color={colors.foreground}>
            {trip?.busLabel ?? (trip ? "Bus" : "Ready when you are")}
          </Text>
          {trip && (
            <Text variant="caption" color={colors.mutedForeground}>
              Status: {trip.status}
            </Text>
          )}
        </GlassSurface>

        <GlassSurface style={styles.card}>
          <LiveIndicator live={streaming} />
        </GlassSurface>

        <View style={styles.metrics}>
          <Metric label="Speed" value={speed} unit="km/h" />
          <Metric label="GPS" value={accuracy} />
          <Metric label="Updated" value={updatedAgo} />
        </View>

        {permissionDenied && (
          <Pressable onPress={() => void Linking.openSettings()}>
            <View style={styles.warning}>
              <Text variant="label" color={colors.warning}>
                Location permission required
              </Text>
              <Text variant="caption" color={colors.mutedForeground}>
                Allow "Always" location so the bus stays live while your screen
                is off. Tap to open Settings.
              </Text>
            </View>
          </Pressable>
        )}

        {error && (
          <Text variant="caption" color={colors.danger}>
            {error}
          </Text>
        )}
      </View>

      <View style={styles.actionWrap}>
        <Pressable
          onPress={streaming ? end : start}
          disabled={busy}
          style={({ pressed }) => [
            styles.action,
            streaming ? styles.actionEnd : styles.actionStart,
            pressed && styles.actionPressed,
            busy && styles.actionDisabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text variant="subtitle" color={colors.primaryForeground}>
              {streaming ? "End trip" : "Start trip"}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" color={colors.faintForeground}>
        {label}
      </Text>
      <View style={styles.metricValue}>
        <Text variant="subtitle" color={colors.foreground} tabular>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" color={colors.mutedForeground} style={styles.metricUnit}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  body: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  card: { padding: spacing.xl, gap: spacing.xs },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  metricValue: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  metricUnit: { marginBottom: 3 },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  actionWrap: { padding: spacing.xl },
  action: {
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  actionStart: { backgroundColor: colors.primary },
  actionEnd: { backgroundColor: colors.danger },
  actionPressed: { opacity: 0.85 },
  actionDisabled: { opacity: 0.6 },
});
