import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
} from "react-native-maps";
import {
  Text,
  ScreenHeader,
  EmptyState,
  Icon,
  colors,
  spacing,
  radius,
  env,
  MAP_STYLE_DARK,
} from "@ubts/shared";
import type { RoutePresentation, RouteLiveBus } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";
import { getRoutePresentation } from "../features/passenger/api/passenger.api";
import { getRouteLiveBuses } from "../features/passenger/api/favorites.api";

const POLL_MS = 5000;

interface Props {
  routeId: string;
  routeName: string;
}

export function RouteDetailScreen({ routeId, routeName }: Props) {
  const { goBack } = useNav();
  const mapRef = useRef<MapView | null>(null);
  const [presentation, setPresentation] = useState<RoutePresentation | null>(null);
  const [buses, setBuses] = useState<RouteLiveBus[]>([]);
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    let active = true;
    void getRoutePresentation(routeId)
      .then((p) => {
        if (active) setPresentation(p);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [routeId]);

  const refreshBuses = useCallback(async () => {
    try {
      const next = await getRouteLiveBuses(routeId);
      setBuses(next);
    } catch {
      // keep last-known buses on a transient failure
    }
  }, [routeId]);

  useEffect(() => {
    void refreshBuses();
    const interval = setInterval(() => void refreshBuses(), POLL_MS);
    return () => clearInterval(interval);
  }, [refreshBuses]);

  useEffect(() => {
    if (fitted || !presentation || !mapRef.current) return;
    const coords = presentation.polyline.map(([latitude, longitude]) => ({
      latitude,
      longitude,
    }));
    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
      setFitted(true);
    }
  }, [presentation, fitted]);

  const polyCoords = (presentation?.polyline ?? []).map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
  const liveBuses = buses.filter((b) => b.latitude != null && b.longitude != null);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title={routeName}
        subtitle={
          liveBuses.length > 0
            ? `${liveBuses.length} bus${liveBuses.length > 1 ? "es" : ""} live`
            : "No buses running"
        }
        onBack={goBack}
      />
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          customMapStyle={MAP_STYLE_DARK as unknown as MapStyleElement[]}
          initialRegion={{
            latitude: env.map.defaultLat,
            longitude: env.map.defaultLng,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
        >
          {polyCoords.length > 1 && (
            <Polyline coordinates={polyCoords} strokeColor={colors.primary} strokeWidth={4} />
          )}
          {presentation?.origin && (
            <Marker
              coordinate={{
                latitude: presentation.origin.latitude,
                longitude: presentation.origin.longitude,
              }}
              title={presentation.origin.name}
              pinColor={colors.success}
            />
          )}
          {presentation?.destination && (
            <Marker
              coordinate={{
                latitude: presentation.destination.latitude,
                longitude: presentation.destination.longitude,
              }}
              title={presentation.destination.name}
              pinColor={colors.danger}
            />
          )}
          {liveBuses.map((b) => (
            <Marker
              key={b.tripId}
              coordinate={{ latitude: b.latitude as number, longitude: b.longitude as number }}
              title={b.busLabel ?? "Bus"}
              description={
                b.etaMinutes != null
                  ? `${b.etaMinutes} min to ${b.nextStopName ?? "next stop"}`
                  : "Live"
              }
              pinColor={colors.primary}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: liveBuses.length ? colors.success : colors.faintForeground },
            ]}
          />
          <Text variant="caption" color={colors.mutedForeground} style={styles.section}>
            {liveBuses.length > 0
              ? `${liveBuses.length} BUS${liveBuses.length > 1 ? "ES" : ""} RUNNING`
              : "NO BUSES RUNNING"}
          </Text>
        </View>

        {liveBuses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="bus-outline"
              title="No buses on this line"
              subtitle="Pull live buses appear here as drivers start their trips."
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {liveBuses.map((b) => (
              <View key={b.tripId} style={styles.busCard}>
                <View style={styles.busIcon}>
                  <Icon name="bus" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <Text variant="label" color={colors.foreground}>
                    {b.busLabel ?? "Bus"}
                  </Text>
                  <Text variant="caption" color={colors.mutedForeground}>
                    {b.nextStopName ? `Next: ${b.nextStopName}` : "On route"}
                    {b.speedKmh != null ? ` · ${Math.round(b.speedKmh)} km/h` : ""}
                  </Text>
                </View>
                <View style={styles.etaPill}>
                  <Text variant="subtitle" color={colors.primary} tabular>
                    {b.etaMinutes != null ? String(b.etaMinutes) : "—"}
                  </Text>
                  <Text variant="caption" color={colors.mutedForeground}>
                    min
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1, overflow: "hidden" },
  flex: { flex: 1 },
  sheet: {
    maxHeight: "46%",
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  section: { letterSpacing: 1.2 },
  emptyWrap: { height: 160 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  busCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
  },
  busIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  etaPill: {
    alignItems: "center",
    minWidth: 52,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
});
