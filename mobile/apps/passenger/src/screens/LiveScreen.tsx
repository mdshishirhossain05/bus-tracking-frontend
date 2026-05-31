import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
  useT,
} from "@ubts/shared";
import { colors, spacing, radius } from "@ubts/shared";
import { useNotifications } from "@ubts/shared";
import { usePassengerLiveTrip } from "../features/passenger/hooks/usePassengerLiveTrip";
import { LiveMap } from "../features/passenger/components/LiveMap";
import { TripSheet } from "../features/passenger/components/TripSheet";
import { ConnectionPill } from "../features/passenger/components/ConnectionPill";
import { NextBusBanner } from "../components/NextBusBanner";
import { PreTripBanner } from "../features/passenger/components/PreTripBanner";
import { ServiceAlertBanner } from "../features/passenger/components/ServiceAlertBanner";
import { useNav } from "../navigation/NavigationContext";

function TopActions() {
  const { navigate } = useNav();
  const { unreadCount } = useNotifications();
  return (
    <View style={styles.actions}>
      <IconButton name="map-outline" onPress={() => navigate("routes")} />
      <IconButton
        name="notifications-outline"
        onPress={() => navigate("notifications")}
        badge={unreadCount}
      />
      <IconButton name="person-outline" onPress={() => navigate("profile")} />
    </View>
  );
}

export function LiveScreen() {
  const t = useT();
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
    retry,
  } = usePassengerLiveTrip();

  const mapRef = useRef<MapView | null>(null);
  const [following, setFollowing] = useState(true);

  // A gentle haptic when the bus reaches a stop — a native-only "real" cue.
  useEffect(() => {
    if (recentArrival) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [recentArrival]);

  const recenter = useCallback(() => {
    void Haptics.selectionAsync();
    setFollowing(true);
    if (liveState) {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: liveState.latitude,
            longitude: liveState.longitude,
          },
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
            <TopActions />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LiveMap
        mapRef={mapRef}
        live={liveState}
        route={route}
        passenger={passengerLocation}
        following={following}
        stale={isStale || tripEnded}
        onUserPan={() => setFollowing(false)}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={["top"]}>
        <View style={styles.topBar} pointerEvents="box-none">
          <ConnectionPill status={connectionStatus} />
          <TopActions />
        </View>
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
        <Pressable onPress={recenter}>
          <GlassSurface rounded="pill" style={styles.fab}>
            <Icon
              name="locate"
              size={22}
              color={following ? colors.primary : colors.mutedForeground}
            />
          </GlassSurface>
        </Pressable>
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
        refreshing={refreshing}
        onRefresh={retry}
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
  fabWrap: {
    position: "absolute",
    right: spacing.lg,
    bottom: "20%",
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
