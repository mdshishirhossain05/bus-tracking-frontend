import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import * as Haptics from "expo-haptics";
import {
  Text,
  GlassSurface,
  Icon,
  IconButton,
  Skeleton,
  SkeletonGroup,
  EmptyState,
  useI18n,
  localizeNumber,
} from "@ubts/shared";
import { colors, spacing, radius } from "@ubts/shared";
import { useNotifications } from "@ubts/shared";
import { usePassengerLiveTrip } from "../features/passenger/hooks/usePassengerLiveTrip";
import { useMapPrefs } from "../features/passenger/hooks/useMapPrefs";
import { useDestinationStop } from "../features/passenger/hooks/useDestinationStop";
import { useBackgroundTrackingNotification } from "../features/passenger/hooks/useBackgroundTrackingNotification";
import type { LiveBusLocation } from "@ubts/shared";
import { LiveMap } from "../features/passenger/components/LiveMap";
import type { BusMarkerStatus } from "../features/passenger/components/BusMarker";
import { TripSheet } from "../features/passenger/components/TripSheet";
import { ConnectionPill } from "../features/passenger/components/ConnectionPill";
import { LiveStatusHud } from "../features/passenger/components/LiveStatusHud";
import { OfflineBanner } from "../features/passenger/components/OfflineBanner";
import { StaleDataBanner } from "../features/passenger/components/StaleDataBanner";
import { LayersFAB } from "../features/passenger/components/LayersFAB";
import { TripCard } from "../features/passenger/components/TripCard";
import { NextBusBanner } from "../components/NextBusBanner";
import { HamburgerMenu } from "../components/HamburgerMenu";
import { PreTripBanner } from "../features/passenger/components/PreTripBanner";
import { ServiceAlertBanner } from "../features/passenger/components/ServiceAlertBanner";
import { useNav } from "../navigation/NavigationContext";

function TopActions({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { navigate } = useNav();
  const { unreadCount } = useNotifications();
  return (
    <View style={styles.actions}>
      <IconButton
        name="notifications-outline"
        onPress={() => navigate("notifications")}
        badge={unreadCount}
        accessibilityLabel="Notifications"
      />
      <IconButton
        name="calendar-outline"
        onPress={() => navigate("todaysSchedules")}
        accessibilityLabel="Today's schedules"
      />
      <IconButton
        name="menu-outline"
        onPress={onOpenMenu}
        accessibilityLabel="Menu"
      />
    </View>
  );
}

export function LiveScreen() {
  const { t, locale } = useI18n();
  const {
    loading,
    refreshing,
    error,
    trips,
    selectedTripId,
    selectTrip,
    liveState,
    eta,
    route,
    recentArrival,
    connectionStatus,
    isStale,
    tripEnded,
    passengerLocation,
    preTripPhase,
    lastFetchAt,
    retry,
  } = usePassengerLiveTrip();

  const mapRef = useRef<MapView | null>(null);
  const [following, setFollowing] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // Default view is the trip-cards "home". User taps Live Track on a
  // specific card → switches to the map tracking view. Back button on
  // the tracking view returns to home so the user can pick a different
  // trip without scrolling chips.
  const [view, setView] = useState<"home" | "tracking">("home");
  const { navigate } = useNav();
  const { unreadCount } = useNotifications();
  const { hybrid, setHybrid, traffic, setTraffic, darkMap, setDarkMap } =
    useMapPrefs();

  // Shared destination-stop state — lifted here so both the map (next-stop
  // pin + bus callout "your stop" treatment) and the bottom sheet (stop
  // picker + get-off banner) read the same selection.
  const destination = useDestinationStop({
    tripId: selectedTripId || null,
    eta,
    routeStops: route?.stops,
  });

  const selectedTrip = trips.find((tr) => tr.tripId === selectedTripId) ?? null;
  const isRunning =
    !tripEnded && !preTripPhase && selectedTrip?.status === "RUNNING";

  // Before the real GPS feed kicks in (PRE_TRIP, bus still parked at the
  // depot) `liveState` is null, so the BusMarker never rendered on this
  // screen — a glaring mismatch with the route-detail map, which DOES
  // place a marker at the depot with a "Pre-trip" callout. To match,
  // synthesize a stand-in fix at the route's origin so the marker (and
  // its passive callout) appear at the depot until a real fix arrives.
  // We do this only for the map; the bottom sheet + HUD keep using the
  // real `liveState` so their copy ("Trip hasn't started yet") still
  // tells the truth.
  const effectiveLive = useMemo<LiveBusLocation | null>(() => {
    if (liveState) return liveState;
    if (!preTripPhase) return null;
    const originLat = route?.origin?.latitude;
    const originLng = route?.origin?.longitude;
    if (
      originLat == null ||
      originLng == null ||
      !selectedTripId ||
      !route?.routeId
    ) {
      return null;
    }
    return {
      tripId: selectedTripId,
      routeId: route.routeId,
      busId: selectedTrip?.busId ?? null,
      latitude: originLat,
      longitude: originLng,
      speed: 0,
      displaySpeedKmh: 0,
      filteredSpeedKmh: 0,
      heading: null,
      isStationary: true,
      source: "PRE_TRIP_DEPOT",
      updatedAt:
        selectedTrip?.preTripStartedAt ??
        selectedTrip?.startedAt ??
        new Date(0).toISOString(),
    };
  }, [
    liveState,
    preTripPhase,
    route?.origin?.latitude,
    route?.origin?.longitude,
    route?.routeId,
    selectedTripId,
    selectedTrip?.busId,
    selectedTrip?.preTripStartedAt,
    selectedTrip?.startedAt,
  ]);

  const destinationStopName = useMemo(() => {
    if (!destination.destinationStopId || !route?.stops) return null;
    return (
      route.stops.find((s) => s.id === destination.destinationStopId)?.name ??
      null
    );
  }, [destination.destinationStopId, route?.stops]);

  // Status shown in the callout attached to the bus marker. While the trip
  // is RUNNING this is the full live status (next stop · ETA · speed, with
  // the "your stop" treatment). When the trip ISN'T running but we still
  // have a fix (parked, pre-trip, ended, or a stale feed), we show a
  // PASSIVE callout instead — so the rider can always see where the bus is
  // and what it's doing, even before the trip starts.
  const busStatus = useMemo<BusMarkerStatus | null>(() => {
    if (!effectiveLive) return null;
    const rawSpeed =
      effectiveLive.displaySpeedKmh ??
      effectiveLive.filteredSpeedKmh ??
      effectiveLive.speed ??
      null;
    const stationary =
      effectiveLive.isStationary === true || (rawSpeed != null && rawSpeed < 3);

    if (isRunning) {
      const nextStopName = eta?.nextStopName ?? null;
      const isYourStop =
        !!destinationStopName &&
        !!nextStopName &&
        nextStopName.trim().toLowerCase() ===
          destinationStopName.trim().toLowerCase();
      // When the trip is RUNNING but ETA hasn't loaded yet (first few
      // seconds after the trip starts, or no schedule resolved) we
      // STILL want a callout above the bus — the rider should always
      // see WHAT the bus is doing. Fall back to a "Live · tracking"
      // passive headline (+ speed via the same status object) instead
      // of returning a callout-less record. Without this the marker
      // sat naked on the map until the first ETA arrived.
      if (!nextStopName) {
        return {
          nextStopName: null,
          etaMinutes: null,
          distanceMeters: null,
          isYourStop: false,
          finalReached: false,
          stationary,
          passiveHeadline: stationary
            ? t("busCallout.passive.parked")
            : t("busCallout.passive.live"),
          passiveSubline: stationary
            ? t("busCallout.passive.parkedSub")
            : t("busCallout.passive.liveSub"),
        };
      }
      return {
        nextStopName,
        etaMinutes: eta?.etaMinutes ?? null,
        distanceMeters: eta?.nextStopDistanceMeters ?? null,
        isYourStop,
        finalReached: eta?.finalStopReached === true,
        stationary,
      };
    }

    // ── Passive (not running, but we have a position) ──────────────────
    let passiveHeadline: string;
    let passiveSubline: string | null = null;
    if (tripEnded) {
      passiveHeadline = t("busCallout.passive.ended");
    } else if (preTripPhase) {
      passiveHeadline = t("busCallout.passive.preTrip");
      passiveSubline = t("busCallout.passive.preTripSub");
    } else if (isStale) {
      // Feed has gone quiet — tell the rider how old the last fix is so a
      // frozen marker doesn't read as a live one.
      const updatedMs = effectiveLive.updatedAt
        ? new Date(effectiveLive.updatedAt).getTime()
        : NaN;
      const mins = Number.isNaN(updatedMs)
        ? null
        : Math.max(0, Math.round((Date.now() - updatedMs) / 60_000));
      passiveHeadline = t("busCallout.passive.stale");
      passiveSubline =
        mins == null || mins <= 0
          ? t("busCallout.passive.lastSeenNow")
          : t("busCallout.passive.lastSeenMin", {
              n: localizeNumber(mins, locale),
            });
    } else {
      passiveHeadline = stationary
        ? t("busCallout.passive.parked")
        : t("busCallout.passive.idle");
      passiveSubline = stationary ? t("busCallout.passive.parkedSub") : null;
    }

    return {
      nextStopName: null,
      etaMinutes: null,
      distanceMeters: null,
      isYourStop: false,
      finalReached: false,
      stationary,
      passiveHeadline,
      passiveSubline,
    };
  }, [
    isRunning,
    effectiveLive,
    eta,
    destinationStopName,
    preTripPhase,
    tripEnded,
    isStale,
    t,
    locale,
  ]);

  // Live-tracking notification content — keeps the bus status visible in the
  // notification bar (foreground service) while the rider is away from the app.
  const trackingNotif = useMemo(() => {
    const title =
      selectedTrip?.routeName ?? selectedTrip?.busLabel ?? t("busNotif.title");
    if (!busStatus) return { title, body: t("hud.tracking") };
    if (busStatus.finalReached) return { title, body: t("tripSheet.arrived") };

    const parts: string[] = [];
    if (busStatus.nextStopName) {
      const prefix = busStatus.isYourStop
        ? t("busNotif.yourStop")
        : t("busNotif.next");
      parts.push(`${prefix}: ${busStatus.nextStopName}`);
    }
    if (busStatus.etaMinutes != null && busStatus.etaMinutes >= 0) {
      parts.push(
        `${localizeNumber(busStatus.etaMinutes, locale)} ${t("common.min")}`,
      );
    } else if (busStatus.stationary) {
      parts.push(t("hud.stopped"));
    }
    return { title, body: parts.join("  ·  ") || t("hud.tracking") };
  }, [selectedTrip, busStatus, t, locale]);

  // Drive the background foreground-service notification. Active only while the
  // rider is on the tracking view watching a RUNNING trip — so the service is
  // always started from the foreground (Android requirement) and torn down when
  // they leave or the trip ends.
  useBackgroundTrackingNotification({
    enabled: view === "tracking" && !!isRunning,
    title: trackingNotif.title,
    body: trackingNotif.body,
  });

  // A gentle haptic when the bus reaches a stop — a native-only "real" cue.
  useEffect(() => {
    if (recentArrival) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [recentArrival]);

  // When the rider leaves the live tracking view (back pill or hardware
  // back) the foreground-service notification is torn down — fine when
  // they're done, surprising when it's an accidental swipe. We confirm
  // before exiting BUT only while the FG service is actually active
  // (tracking view + RUNNING trip). On any other view we just go home.
  const confirmExitTracking = useCallback(
    (onConfirm: () => void) => {
      const fgActive = view === "tracking" && isRunning;
      if (!fgActive) {
        onConfirm();
        return;
      }
      Alert.alert(
        t("liveExit.title"),
        t("liveExit.body"),
        [
          { text: t("liveExit.cancel"), style: "cancel" },
          {
            text: t("liveExit.confirm"),
            style: "destructive",
            onPress: onConfirm,
          },
        ],
        { cancelable: true },
      );
    },
    [view, isRunning, t],
  );

  // Android hardware back: while we're actively tracking, intercept the
  // back press and run the same confirmation; otherwise let the OS
  // default behaviour handle it (which on a single-stack app means
  // backgrounding to home).
  useEffect(() => {
    if (view !== "tracking") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExitTracking(() => setView("home"));
      return true; // consumed — block default back
    });
    return () => sub.remove();
  }, [view, confirmExitTracking]);

  const recenter = useCallback(() => {
    void Haptics.selectionAsync();
    setFollowing(true);
    // Re-engage follow mode. We match LiveMap's follow framing (north-up,
    // flat, zoom 16) so the bus motion stays legible and this doesn't
    // fight the LiveMap `following` effect that fires on the next tick.
    // Instant feedback before that render tick.
    if (liveState) {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: liveState.latitude,
            longitude: liveState.longitude,
          },
          pitch: 0,
          heading: 0,
          zoom: 17,
        },
        { duration: 600 },
      );
    }
  }, [liveState]);

  if (loading) {
    // Skeleton scaffold of the live tracking screen — same shape as the
    // loaded UI so the layout doesn't jump when data arrives.
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.skeletonTop}>
          <Skeleton width={120} height={28} rounded="pill" />
          <View style={styles.skeletonActions}>
            <Skeleton width={40} height={40} rounded="md" />
            <Skeleton width={40} height={40} rounded="md" />
            <Skeleton width={40} height={40} rounded="md" />
          </View>
        </View>
        <View style={styles.skeletonMap}>
          <Skeleton width="100%" height="100%" rounded={0} />
        </View>
        <View style={styles.skeletonSheet}>
          <SkeletonGroup gap={12}>
            <Skeleton width={160} height={14} />
            <Skeleton width={240} height={22} />
            <Skeleton width="100%" height={56} rounded="lg" />
            <View style={styles.skeletonRow}>
              <Skeleton width={48} height={48} rounded="md" />
              <Skeleton width={48} height={48} rounded="md" />
              <Skeleton width={48} height={48} rounded="md" />
            </View>
          </SkeletonGroup>
        </View>
      </SafeAreaView>
    );
  }

  if (!trips.length) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={retry}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon="bus-outline"
            title={t("live.emptyTitle")}
            subtitle={error ?? t("live.emptySubtitle")}
          />
        </ScrollView>

        <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={["top"]}>
          <View style={styles.topBar} pointerEvents="box-none">
            <View />
            <TopActions onOpenMenu={() => setMenuOpen(true)} />
          </View>
        </SafeAreaView>

        <HamburgerMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(screen) => navigate(screen)}
          unreadCount={unreadCount}
        />
      </View>
    );
  }

  // -------------------- HOME VIEW (trip cards) --------------------
  if (view === "home") {
    const subtitleText =
      trips.length === 1
        ? t("home.subtitle.one")
        : t("home.subtitle.many", { n: trips.length });
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.homeTopBar}>
          <View style={styles.flex}>
            <Text variant="caption" color={colors.mutedForeground}>
              {t("home.title")}
            </Text>
            <Text variant="subtitle" color={colors.foreground}>
              {subtitleText}
            </Text>
          </View>
          <TopActions onOpenMenu={() => setMenuOpen(true)} />
        </View>

        <ScrollView
          contentContainerStyle={styles.homeScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={retry}
              tintColor={colors.primary}
            />
          }
        >
          {trips.map((trip) => {
            const isActive = trip.tripId === selectedTripId;
            return (
              <TripCard
                key={trip.tripId}
                trip={trip}
                etaMinutes={isActive ? eta?.etaMinutes ?? null : null}
                nextStopName={isActive ? eta?.nextStopName ?? null : null}
                onTrack={() => {
                  void Haptics.selectionAsync();
                  selectTrip(trip.tripId);
                  setFollowing(true);
                  setView("tracking");
                }}
              />
            );
          })}
        </ScrollView>

        <HamburgerMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(screen) => navigate(screen)}
          unreadCount={unreadCount}
        />
      </SafeAreaView>
    );
  }

  // -------------------- TRACKING VIEW (map + sheet) --------------------
  return (
    <View style={styles.root}>
      <LiveMap
        mapRef={mapRef}
        live={effectiveLive}
        route={route}
        passenger={passengerLocation}
        following={following}
        stale={isStale || tripEnded}
        hybrid={hybrid}
        showTraffic={traffic}
        darkMap={darkMap}
        busLabel={
          trips.find((t) => t.tripId === selectedTripId)?.busLabel ??
          trips.find((t) => t.tripId === selectedTripId)?.routeName ??
          null
        }
        nextStopName={isRunning ? eta?.nextStopName ?? null : null}
        destinationStopName={destinationStopName}
        busStatus={busStatus}
        onUserPan={() => setFollowing(false)}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={["top"]}>
        <View style={styles.topBar} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              confirmExitTracking(() => setView("home"));
            }}
            accessibilityRole="button"
            accessibilityLabel={t("home.backToTrips")}
          >
            <GlassSurface rounded="pill" style={styles.backPill}>
              <Icon name="chevron-back" size={16} color={colors.foreground} />
              <Text variant="caption" color={colors.foreground}>
                {trips.length > 1 ? t("home.switchTrip") : t("home.allTrips")}
              </Text>
            </GlassSurface>
          </Pressable>
          <TopActions onOpenMenu={() => setMenuOpen(true)} />
        </View>
        <View style={styles.pillRow} pointerEvents="box-none">
          <ConnectionPill
            status={connectionStatus}
            lastFetchAt={lastFetchAt}
          />
        </View>
        {/* On-map live status — next stop, ETA, and speed visible without
            opening the bottom sheet. This is the surface passengers watch. */}
        <LiveStatusHud live={liveState} eta={eta} isRunning={isRunning} />
        <OfflineBanner
          status={connectionStatus}
          lastFetchAt={lastFetchAt}
        />
        {/* Stale-data banner: trip is RUNNING but bus position hasn't
            updated in a while. Tiered amber → red messaging tells the
            user how old the data is and where to look. */}
        <StaleDataBanner liveState={liveState} />
        {/* Service alerts always trump everything else — admin's voice. */}
        <ServiceAlertBanner
          routeId={trips.find((t) => t.tripId === selectedTripId)?.routeId}
        />
        {/*
          The pre-trip banner takes precedence over NextBusBanner when the
          current trip hasn't officially started yet — what matters most
          right then is WHERE the bus is (depot / approaching / arrived),
          not which other route is next.
        */}
        {preTripPhase ? (
          <PreTripBanner phase={preTripPhase} />
        ) : (
          <NextBusBanner />
        )}
      </SafeAreaView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <LayersFAB
          hybrid={hybrid}
          onHybridChange={setHybrid}
          traffic={traffic}
          onTrafficChange={setTraffic}
          darkMap={darkMap}
          onDarkMapChange={setDarkMap}
        />
        {/* Re-center button — Google-Maps style: only shown once the
            rider has panned/zoomed away from the bus. While the camera
            is following, there's nothing to recenter, so it stays hidden. */}
        {!following ? (
          <Pressable onPress={recenter} accessibilityLabel="Re-center on bus">
            <GlassSurface rounded="pill" style={styles.fab}>
              <Icon name="locate" size={22} color={colors.primary} />
            </GlassSurface>
          </Pressable>
        ) : null}
      </View>

      <TripSheet
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={selectTrip}
        eta={eta}
        live={liveState}
        route={route}
        tripEnded={tripEnded}
        recentArrival={recentArrival}
        passengerLocation={passengerLocation}
        refreshing={refreshing}
        onRefresh={retry}
        destination={destination}
      />

      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(screen) => navigate(screen)}
        unreadCount={unreadCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  center: { textAlign: "center" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  homeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  homeScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  pillRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  fabWrap: {
    position: "absolute",
    right: spacing.lg,
    bottom: "20%",
    gap: spacing.sm,
    alignItems: "flex-end",
  },
  fab: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skeletonActions: { flexDirection: "row", gap: spacing.sm },
  skeletonMap: {
    flex: 1,
    margin: spacing.lg,
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  skeletonSheet: {
    padding: spacing.xl,
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
  },
  skeletonRow: { flexDirection: "row", gap: spacing.sm },
});
