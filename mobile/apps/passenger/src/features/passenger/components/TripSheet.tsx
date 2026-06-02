import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import {
  Text,
  Icon,
  StatusBadge,
  localizeNumber,
  useI18n,
  type StatusBadgeTone,
  type IconName,
  type StringKey,
} from "@ubts/shared";
import { colors, radius, spacing } from "@ubts/shared";
import { StopTimeline } from "./StopTimeline";
import { OccupancyVoter } from "./OccupancyVoter";
import { WalkToStopChip } from "./WalkToStopChip";
import { OtherBusesCard } from "./OtherBusesCard";
import { DestinationBanner } from "./DestinationBanner";
import { useStopSubscriptions } from "../hooks/useStopSubscriptions";
import { useTripOccupancy } from "../hooks/useTripOccupancy";
import { useRouteLiveBuses } from "../hooks/useRouteLiveBuses";
import { useDestinationStop } from "../hooks/useDestinationStop";
import { haversineMeters } from "@ubts/shared";
import type {
  ActiveTrip,
  LiveBusLocation,
  PassengerLocation,
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
  passengerLocation?: PassengerLocation | null;
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
  passengerLocation,
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
  const liveBuses = useRouteLiveBuses(
    selectedTrip?.routeId ?? route?.routeId ?? null,
  );
  const destination = useDestinationStop({
    tripId: selectedTripId || null,
    eta,
    routeStops: route?.stops,
  });

  // Passenger's nearest stop on the selected route + walking distance.
  // Computed locally from the route geometry + passenger location so
  // the chip doesn't depend on a backend round-trip.
  const nearestStop = useMemo(() => {
    if (!passengerLocation || !route?.stops?.length) return null;
    let best: { stop: { id: string; name: string }; meters: number } | null =
      null;
    for (const stop of route.stops) {
      const d = haversineMeters(
        passengerLocation.latitude,
        passengerLocation.longitude,
        stop.latitude,
        stop.longitude,
      );
      if (!best || d < best.meters) {
        best = { stop: { id: stop.id, name: stop.name }, meters: d };
      }
    }
    return best;
  }, [passengerLocation, route?.stops]);

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

  const isRunning = selectedTrip?.status === "RUNNING" && !tripEnded;
  const isPreTrip = selectedTrip?.status === "PRE_TRIP";
  const isEnded = tripEnded || selectedTrip?.status === "ENDED";

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

  // Trip-status hero block — one always-visible "what's happening right
  // now" answer at the top of the sheet so passengers don't conflate
  // a planned bus with a live one.
  const hero = ((): {
    tone: StatusBadgeTone;
    icon: IconName;
    titleKey: StringKey;
    bodyKey: StringKey;
  } => {
    if (isRunning) {
      return {
        tone: "live",
        icon: "radio-button-on",
        titleKey: "tripSheet.hero.live.title",
        bodyKey: "tripSheet.hero.live.body",
      };
    }
    if (isPreTrip) {
      return {
        tone: "preTrip",
        icon: "time-outline",
        titleKey: "tripSheet.hero.preTrip.title",
        bodyKey: "tripSheet.hero.preTrip.body",
      };
    }
    if (isEnded) {
      return {
        tone: "ended",
        icon: "checkmark-done-outline",
        titleKey: "tripSheet.hero.ended.title",
        bodyKey: "tripSheet.hero.ended.body",
      };
    }
    return {
      tone: "muted",
      icon: "bus-outline",
      titleKey: "tripSheet.hero.noTrip.title",
      bodyKey: "tripSheet.hero.noTrip.body",
    };
  })();

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

        <View
          style={[
            styles.hero,
            hero.tone === "live" && styles.heroLive,
            hero.tone === "preTrip" && styles.heroPreTrip,
            hero.tone === "ended" && styles.heroEnded,
          ]}
        >
          <Icon
            name={hero.icon}
            size={20}
            color={
              hero.tone === "live"
                ? colors.success
                : hero.tone === "preTrip"
                  ? colors.primary
                  : colors.mutedForeground
            }
          />
          <View style={styles.flex}>
            <Text variant="label" color={colors.foreground}>
              {t(hero.titleKey)}
            </Text>
            <Text variant="caption" color={colors.mutedForeground}>
              {t(hero.bodyKey)}
            </Text>
          </View>
        </View>

        {/*
          ETA, "to next stop" label, and the speed/confidence/stops grid
          only make sense once the trip is RUNNING. PRE_TRIP shows the
          PreTripBanner above the map and the hero block above; ENDED
          shows the hero block. Hiding them removes the most common
          source of "is the trip on or off?" confusion.
        */}
        {isRunning ? (
          <>
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
                  {t("tripSheet.arrivedAtStop", {
                    stop: recentArrival.stopName,
                  })}
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Walk-time to nearest stop on the route — small green chip, only
            shown when the passenger is within 5km and not already at the
            stop. Uses local haversine, no backend round-trip. */}
        {nearestStop && nearestStop.meters > 80 && nearestStop.meters < 5000 ? (
          <WalkToStopChip
            stopName={nearestStop.stop.name}
            distanceMeters={nearestStop.meters}
          />
        ) : null}

        {/* Destination-approaching banner — get-off-here reminder.
            Triggered by useDestinationStop when the bus is closing in. */}
        <DestinationBanner
          alert={destination.alert}
          onDismiss={destination.clearAlert}
        />

        {selectedTrip?.status === "RUNNING" ? (
          <OccupancyVoter
            aggregate={occupancy.aggregate}
            onVote={occupancy.vote}
            busy={occupancy.busy}
          />
        ) : null}

        {/* Multi-bus comparison — only shown when another active bus
            is running on the same route. Tap to switch to that trip. */}
        <OtherBusesCard
          buses={liveBuses.buses}
          selectedTripId={selectedTripId}
          onSelect={(tripId) => onSelectTrip(tripId)}
        />

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
              // Suppress the "next stop" highlight + passed-stops fade while
              // the trip isn't actually RUNNING. PRE_TRIP / ENDED stop
              // progression would otherwise tell a story that doesn't match
              // reality (the bus hasn't passed any stops yet).
              nextStopName={isRunning ? eta?.nextStopName : null}
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
              isDestination={(stopId) => destination.isDestination(stopId)}
              onToggleDestination={(stopId) => {
                destination.setDestination(
                  destination.isDestination(stopId) ? null : stopId,
                );
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
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroLive: { backgroundColor: "rgba(34, 197, 94, 0.12)" },
  heroPreTrip: { backgroundColor: "rgba(59, 130, 246, 0.12)" },
  heroEnded: { backgroundColor: colors.muted },
  flex: { flex: 1 },
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
