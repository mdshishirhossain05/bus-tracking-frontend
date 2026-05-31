import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import {
  Text,
  StatusBadge,
  localizeNumber,
  useI18n,
  type StatusBadgeTone,
} from "@ubts/shared";
import { colors, radius, spacing } from "@ubts/shared";
import { StopTimeline } from "./StopTimeline";
import { OccupancyVoter } from "./OccupancyVoter";
import { useStopSubscriptions } from "../hooks/useStopSubscriptions";
import { useTripOccupancy } from "../hooks/useTripOccupancy";
import type {
  ActiveTrip,
  LiveBusLocation,
  RoutePresentation,
  TripEta,
  TripStopArrivalPayload,
} from "@ubts/shared";

interface TripSheetProps {
  trips: ActiveTrip[];
  selectedTripId: string;
  onSelectTrip: (tripId: string) => void;
  eta: TripEta | null;
  live: LiveBusLocation | null;
  route: RoutePresentation | null;
  tripEnded: boolean;
  recentArrival: TripStopArrivalPayload | null;
  refreshing?: boolean;
  onRefresh?: () => void;
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
  refreshing = false,
  onRefresh,
}: TripSheetProps) {
  const { t, locale } = useI18n();
  const snapPoints = useMemo(() => ["17%", "52%", "90%"], []);

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.tripId === selectedTripId) ?? null,
    [trips, selectedTripId],
  );

  const subs = useStopSubscriptions();
  const routeIdForSubs = route?.routeId ?? selectedTrip?.routeId ?? null;
  const occupancy = useTripOccupancy(
    selectedTrip?.status === "RUNNING" ? selectedTripId : null,
  );

  const statusBadge = useMemo<{
    tone: StatusBadgeTone;
    label: string;
    withDot: boolean;
  } | null>(() => {
    if (tripEnded)
      return { tone: "ended", label: t("badge.ended"), withDot: false };
    if (!selectedTrip) return null;
    if (selectedTrip.status === "PRE_TRIP") {
      return { tone: "preTrip", label: t("badge.preTrip"), withDot: true };
    }
    if (selectedTrip.status === "RUNNING") {
      return { tone: "live", label: t("badge.live"), withDot: true };
    }
    if (selectedTrip.status === "ENDED") {
      return { tone: "ended", label: t("badge.ended"), withDot: false };
    }
    return null;
  }, [selectedTrip, tripEnded, t]);

  const etaLabel = tripEnded
    ? t("tripSheet.ended")
    : eta?.finalStopReached
      ? t("tripSheet.arrived")
      : eta?.etaMinutes != null
        ? localizeNumber(eta.etaMinutes, locale)
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
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        <View style={styles.headerRow}>
          <Text variant="label" color={colors.mutedForeground}>
            {route?.routeName ?? selectedTrip?.routeName ?? t("tripSheet.liveTrip")}
          </Text>
          {statusBadge ? (
            <StatusBadge
              tone={statusBadge.tone}
              label={statusBadge.label}
              withDot={statusBadge.withDot}
            />
          ) : null}
        </View>

        <View style={styles.etaRow}>
          <Text variant="display" color={colors.foreground} tabular>
            {etaLabel}
          </Text>
          {showsUnit && (
            <Text variant="subtitle" color={colors.mutedForeground} style={styles.unit}>
              {t("common.min")}
            </Text>
          )}
        </View>
        <Text variant="body" color={colors.mutedForeground}>
          {eta?.nextStopName
            ? t("tripSheet.toStop", { stop: eta.nextStopName })
            : t("tripSheet.tracking")}
        </Text>

        <View style={styles.metrics}>
          <Metric
            label={t("tripSheet.speed")}
            value={speed != null ? localizeNumber(speed, locale) : "—"}
            unit={t("common.kmh")}
          />
          <Metric
            label={t("tripSheet.confidence")}
            value={eta?.confidence ?? "—"}
          />
          <Metric
            label={t("tripSheet.stops")}
            value={
              route?.stops.length
                ? localizeNumber(route.stops.length, locale)
                : "—"
            }
          />
        </View>

        {recentArrival && (
          <View style={styles.arrival}>
            <View style={styles.arrivalDot} />
            <Text variant="label" color={colors.foreground}>
              {t("tripSheet.arrivedAtStop", { stop: recentArrival.stopName })}
            </Text>
          </View>
        )}

        {selectedTrip?.status === "RUNNING" ? (
          <OccupancyVoter
            aggregate={occupancy.aggregate}
            onVote={occupancy.vote}
            busy={occupancy.busy}
          />
        ) : null}

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
              {t("tripSheet.route")}
            </Text>
            <StopTimeline
              stops={route.stops}
              nextStopName={eta?.nextStopName}
              routeId={routeIdForSubs}
              isSubscribed={(stopId) =>
                routeIdForSubs
                  ? subs.isSubscribed(routeIdForSubs, stopId)
                  : false
              }
              onToggleSubscription={(stopId, stopName) => {
                if (!routeIdForSubs) return;
                void subs.toggle({
                  routeId: routeIdForSubs,
                  stopId,
                  stopName,
                });
              }}
            />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
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
