import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";
import {
  GlassSurface,
  Text,
  Icon,
  colors,
  radius,
  spacing,
  useAuth,
  type IconName,
} from "@ubts/shared";
import { useDriverTrip } from "../hooks/useDriverTrip";
import { LiveIndicator } from "../components/LiveIndicator";
import { DriverMap } from "../components/DriverMap";
import { DriverStopList } from "../components/DriverStopList";
import { useRoutePresentation } from "../features/trip/useRoutePresentation";
import { computeTripProgress } from "../features/trip/tripProgress";
import type { TrackingSource } from "../api/driver.api";

type RegionView = "map" | "stops";
const APPROACH_METERS = 150;

const PRE_TRIP_PILL_COPY: Record<
  "AT_DEPOT" | "APPROACHING_ORIGIN" | "AT_ORIGIN",
  { label: string; icon: IconName; tint: string }
> = {
  AT_DEPOT: {
    label: "Pre-trip · Parked at depot",
    icon: "bed-outline",
    tint: colors.mutedForeground,
  },
  APPROACHING_ORIGIN: {
    label: "Pre-trip · Heading to start",
    icon: "navigate-outline",
    tint: colors.primary,
  },
  AT_ORIGIN: {
    label: "Pre-trip · At start point",
    icon: "checkmark-circle-outline",
    tint: colors.success,
  },
};

function SegmentButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? colors.primaryForeground : colors.mutedForeground;
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentActive]}>
      <Icon name={icon} size={16} color={color} />
      <Text variant="label" color={color}>
        {label}
      </Text>
    </Pressable>
  );
}

function SourceToggle({
  value,
  onChange,
}: {
  value: TrackingSource;
  onChange: (v: TrackingSource) => void;
}) {
  return (
    <View>
      <Text variant="caption" color={colors.faintForeground} style={styles.segmentLabel}>
        LOCATION SOURCE
      </Text>
      <View style={styles.segment}>
        <SegmentButton
          icon="phone-portrait-outline"
          label="My phone"
          active={value === "DRIVER_MOBILE"}
          onPress={() => onChange("DRIVER_MOBILE")}
        />
        <SegmentButton
          icon="hardware-chip-outline"
          label="Bus device"
          active={value === "GPS_DEVICE"}
          onPress={() => onChange("GPS_DEVICE")}
        />
      </View>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <Icon name={icon} size={14} color={colors.faintForeground} />
        <Text variant="caption" color={colors.faintForeground}>
          {label}
        </Text>
      </View>
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

export function DriverHomeScreen() {
  useKeepAwake();
  const { user, signOut } = useAuth();
  const {
    loading,
    trip,
    streaming,
    busy,
    error,
    permissionDenied,
    lastFix,
    preferredSource,
    setPreferredSource,
    start,
    end,
  } = useDriverTrip();

  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<RegionView>("map");
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [streaming]);

  const presentation = useRoutePresentation(trip?.routeId);

  const lat = lastFix?.latitude ?? trip?.latitude ?? null;
  const lng = lastFix?.longitude ?? trip?.longitude ?? null;

  const progress = useMemo(
    () =>
      computeTripProgress({
        stops: presentation?.stops ?? [],
        nextStopName: trip?.nextStopName,
        latitude: lat,
        longitude: lng,
      }),
    [presentation, trip?.nextStopName, lat, lng],
  );

  const inPreTrip = trip?.status === "PRE_TRIP";
  const isRunning = trip?.status === "RUNNING";
  const preTripCopy =
    inPreTrip && trip?.preTripPhase
      ? PRE_TRIP_PILL_COPY[trip.preTripPhase]
      : null;

  const approaching =
    isRunning &&
    progress.distanceToNextM != null &&
    progress.distanceToNextM <= APPROACH_METERS;

  const prevApproaching = useRef(false);
  useEffect(() => {
    if (approaching && !prevApproaching.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    prevApproaching.current = approaching;
  }, [approaching]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const updatedAgo =
    streaming && lastFix
      ? `${Math.max(0, Math.round((now - lastFix.at) / 1000))}s`
      : "—";
  const speed =
    streaming && lastFix?.speedKmh != null ? `${Math.round(lastFix.speedKmh)}` : "—";
  const accuracy =
    streaming && lastFix?.accuracyM != null
      ? `±${Math.round(lastFix.accuracyM)}m`
      : "—";

  const hasStops = (presentation?.stops?.length ?? 0) > 0;
  const showStops = view === "stops" && hasStops;
  const progressFraction =
    progress.total > 1 ? Math.max(0, Math.min(1, progress.nextIndex / (progress.total - 1))) : 0;

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
        <Pressable onPress={signOut} hitSlop={8} style={styles.signOut}>
          <Icon name="log-out-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.region}>
        {hasStops ? (
          <View style={styles.toggleBar}>
            <View style={styles.toggle}>
              <SegmentButton
                icon="map-outline"
                label="Map"
                active={view === "map"}
                onPress={() => setView("map")}
              />
              <SegmentButton
                icon="list-outline"
                label="Stops"
                active={view === "stops"}
                onPress={() => setView("stops")}
              />
            </View>
          </View>
        ) : null}

        {showStops ? (
          <DriverStopList stops={presentation!.stops} nextIndex={progress.nextIndex} />
        ) : (
          <DriverMap presentation={presentation} latitude={lat} longitude={lng} />
        )}

        {preTripCopy ? (
          <View style={styles.approachWrap} pointerEvents="none">
            <GlassSurface rounded="pill" style={styles.approachPill}>
              <Icon name={preTripCopy.icon} size={18} color={preTripCopy.tint} />
              <Text variant="label" color={colors.foreground}>
                {preTripCopy.label}
              </Text>
            </GlassSurface>
          </View>
        ) : approaching ? (
          <View style={styles.approachWrap} pointerEvents="none">
            <GlassSurface rounded="pill" style={styles.approachPill}>
              <Icon name="navigate-circle" size={18} color={colors.warning} />
              <Text variant="label" color={colors.foreground}>
                Approaching {trip?.nextStopName ?? "next stop"}
                {progress.distanceToNextM != null
                  ? ` · ${Math.round(progress.distanceToNextM)}m`
                  : ""}
              </Text>
            </GlassSurface>
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
        <View style={styles.tripRow}>
          <View style={styles.routeIcon}>
            <Icon name="bus" size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text variant="label" color={colors.mutedForeground}>
              {trip ? (trip.routeName ?? "Assigned route") : "No active trip"}
            </Text>
            <Text variant="subtitle" color={colors.foreground}>
              {trip?.busLabel ?? (trip ? "Bus" : "Ready when you are")}
            </Text>
          </View>
          <LiveIndicator live={streaming} />
        </View>

        {streaming && hasStops ? (
          <GlassSurface style={styles.nextStop}>
            <Icon name="navigate-circle-outline" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <Text variant="caption" color={colors.faintForeground}>
                {progress.nextIndex >= 0
                  ? `NEXT STOP · ${progress.nextIndex + 1} OF ${progress.total}`
                  : "NEXT STOP"}
              </Text>
              <Text variant="subtitle" color={colors.foreground}>
                {trip?.nextStopName ?? "On route"}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
              </View>
            </View>
            {trip?.etaMinutes != null ? (
              <View style={styles.etaBox}>
                <Text variant="title" color={colors.primary} tabular>
                  {trip.etaMinutes}
                </Text>
                <Text variant="caption" color={colors.mutedForeground}>
                  min
                </Text>
              </View>
            ) : null}
          </GlassSurface>
        ) : null}

        <View style={styles.metrics}>
          <Metric icon="speedometer-outline" label="Speed" value={speed} unit="km/h" />
          <Metric icon="navigate-outline" label="GPS" value={accuracy} />
          <Metric icon="time-outline" label="Updated" value={updatedAgo} />
        </View>

        {!streaming ? (
          <SourceToggle value={preferredSource} onChange={setPreferredSource} />
        ) : null}

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

        {/*
          Three button states:
            * RUNNING   → "End trip"   (red)
            * PRE_TRIP  → "Start trip now" (green; promotes the open pre-trip
                          row instead of waiting for the auto-promote on
                          origin geofence dwell)
            * otherwise → "Start trip" (green; creates a new trip)
        */}
        <Pressable
          onPress={isRunning ? end : start}
          disabled={busy}
          style={({ pressed }) => [
            styles.action,
            isRunning ? styles.actionEnd : styles.actionStart,
            pressed && styles.actionPressed,
            busy && styles.actionDisabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Icon
                name={
                  isRunning ? "stop-circle-outline" : "play-circle-outline"
                }
                size={22}
                color={colors.primaryForeground}
              />
              <Text variant="subtitle" color={colors.primaryForeground}>
                {isRunning
                  ? "End trip"
                  : inPreTrip
                    ? "Start trip now"
                    : "Start trip"}
              </Text>
            </>
          )}
        </Pressable>

        {inPreTrip ? (
          <Text
            variant="caption"
            color={colors.mutedForeground}
            style={styles.preTripHint}
          >
            Bus is broadcasting location. Trip will start automatically when
            you arrive at the first stop, or tap above to start now.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
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
    paddingVertical: spacing.md,
  },
  signOut: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  region: { flex: 1, overflow: "hidden" },
  toggleBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  approachWrap: {
    position: "absolute",
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  approachPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  panel: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -radius.xl,
  },
  tripRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  routeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  nextStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.muted,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.primary },
  etaBox: { alignItems: "center", minWidth: 52 },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricTop: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metricValue: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  metricUnit: { marginBottom: 3 },
  segmentLabel: { letterSpacing: 1.2, marginBottom: spacing.xs },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  segmentActive: { backgroundColor: colors.primary },
  warning: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  action: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  actionStart: { backgroundColor: colors.primary },
  actionEnd: { backgroundColor: colors.danger },
  actionPressed: { opacity: 0.85 },
  actionDisabled: { opacity: 0.6 },
  preTripHint: { textAlign: "center" },
});
