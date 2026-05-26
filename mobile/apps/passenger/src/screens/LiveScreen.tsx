import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type MapView from "react-native-maps";
import * as Haptics from "expo-haptics";
import { Text, GlassSurface, Icon, IconButton } from "@ubts/shared";
import { colors, spacing } from "@ubts/shared";
import { useNotifications } from "@ubts/shared";
import { usePassengerLiveTrip } from "../features/passenger/hooks/usePassengerLiveTrip";
import { LiveMap } from "../features/passenger/components/LiveMap";
import { TripSheet } from "../features/passenger/components/TripSheet";
import { ConnectionPill } from "../features/passenger/components/ConnectionPill";
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
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text variant="body" color={colors.mutedForeground}>
          Finding your bus…
        </Text>
      </View>
    );
  }

  if (!trips.length) {
    return (
      <View style={styles.root}>
        <View style={styles.centered}>
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
            <Text variant="subtitle" color={colors.foreground}>
              No buses running
            </Text>
            <Text variant="body" color={colors.mutedForeground} style={styles.center}>
              {error ?? "There are no active trips right now. Pull to refresh."}
            </Text>
          </ScrollView>
        </View>

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
});
