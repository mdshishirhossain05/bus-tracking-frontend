import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Text } from "../../../ui/Text";
import { colors, radius, spacing } from "../../../theme/tokens";
import { StopTimeline } from "./StopTimeline";
import type {
  ActiveTrip,
  LiveBusLocation,
  RoutePresentation,
  TripEta,
  TripStopArrivalPayload,
} from "../../../types";

interface TripSheetProps {
  trips: ActiveTrip[];
  selectedTripId: string;
  onSelectTrip: (tripId: string) => void;
  eta: TripEta | null;
  live: LiveBusLocation | null;
  route: RoutePresentation | null;
  tripEnded: boolean;
  recentArrival: TripStopArrivalPayload | null;
}

function GlassBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View style={[style, styles.bg]}>
      <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.bgTint]} />
    </View>
  );
}

export function TripSheet({
  trips,
  selectedTripId,
  onSelectTrip,
  eta,
  live,
  route,
  tripEnded,
  recentArrival,
}: TripSheetProps) {
  const snapPoints = useMemo(() => ["17%", "52%", "90%"], []);

  const etaLabel = tripEnded
    ? "Ended"
    : eta?.finalStopReached
      ? "Arrived"
      : eta?.etaMinutes != null
        ? String(eta.etaMinutes)
        : "—";
  const showsUnit = !tripEnded && !eta?.finalStopReached && eta?.etaMinutes != null;
  const speed =
    live?.displaySpeedKmh != null ? Math.round(live.displaySpeedKmh) : null;

  return (
    <BottomSheet
      index={1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundComponent={GlassBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="label" color={colors.mutedForeground}>
          {route?.routeName ?? trips.find((t) => t.tripId === selectedTripId)?.routeName ?? "Live trip"}
        </Text>

        <View style={styles.etaRow}>
          <Text variant="display" color={colors.foreground} tabular>
            {etaLabel}
          </Text>
          {showsUnit && (
            <Text variant="subtitle" color={colors.mutedForeground} style={styles.unit}>
              min
            </Text>
          )}
        </View>
        <Text variant="body" color={colors.mutedForeground}>
          {eta?.nextStopName ? `to ${eta.nextStopName}` : "Tracking live position"}
        </Text>

        <View style={styles.metrics}>
          <Metric label="Speed" value={speed != null ? `${speed}` : "—"} unit="km/h" />
          <Metric
            label="Confidence"
            value={eta?.confidence ?? "—"}
          />
          <Metric
            label="Stops"
            value={route?.stops.length ? String(route.stops.length) : "—"}
          />
        </View>

        {recentArrival && (
          <View style={styles.arrival}>
            <View style={styles.arrivalDot} />
            <Text variant="label" color={colors.foreground}>
              Arrived at {recentArrival.stopName}
            </Text>
          </View>
        )}

        {trips.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.trips}
            contentContainerStyle={styles.tripsContent}
          >
            {trips.map((trip) => {
              const active = trip.tripId === selectedTripId;
              return (
                <Pressable
                  key={trip.tripId}
                  onPress={() => onSelectTrip(trip.tripId)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    variant="caption"
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  >
                    {trip.routeName ?? trip.busLabel ?? "Trip"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {route?.stops.length ? (
          <View style={styles.timeline}>
            <Text variant="label" color={colors.mutedForeground} style={styles.timelineTitle}>
              Route
            </Text>
            <StopTimeline stops={route.stops} nextStopName={eta?.nextStopName} />
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheet>
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
  bg: {
    overflow: "hidden",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  bgTint: { backgroundColor: colors.glass },
  handle: { backgroundColor: colors.borderStrong, width: 40 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xs },
  etaRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  unit: { marginBottom: 8 },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  metricUnit: { marginBottom: 3 },
  arrival: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  arrivalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  trips: { marginTop: spacing.lg },
  tripsContent: { gap: spacing.sm, paddingRight: spacing.xl },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeline: { marginTop: spacing.xl },
  timelineTitle: { marginBottom: spacing.xs },
});
