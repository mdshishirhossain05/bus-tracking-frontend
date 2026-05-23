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
  GlassSurface,
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

  // Fit the camera to the route once its geometry arrives.
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
      <ScreenHeader title={routeName} onBack={goBack} />
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
            <Polyline
              coordinates={polyCoords}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
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

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="caption" color={colors.mutedForeground} style={styles.section}>
          {liveBuses.length > 0
            ? `${liveBuses.length} BUS${liveBuses.length > 1 ? "ES" : ""} RUNNING`
            : "NO BUSES RUNNING"}
        </Text>
        {liveBuses.length === 0 ? (
          <Text variant="body" color={colors.mutedForeground}>
            No buses are live on this route right now.
          </Text>
        ) : (
          liveBuses.map((b) => (
            <GlassSurface key={b.tripId} style={styles.busCard}>
              <View style={styles.busRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="label" color={colors.foreground}>
                    {b.busLabel ?? "Bus"}
                  </Text>
                  <Text variant="caption" color={colors.mutedForeground}>
                    {b.nextStopName ? `Next: ${b.nextStopName}` : "On route"}
                    {b.speedKmh != null ? ` · ${Math.round(b.speedKmh)} km/h` : ""}
                  </Text>
                </View>
                <View style={styles.etaBox}>
                  <Text variant="title" color={colors.primary} tabular>
                    {b.etaMinutes != null ? String(b.etaMinutes) : "—"}
                  </Text>
                  <Text variant="caption" color={colors.mutedForeground}>
                    min
                  </Text>
                </View>
              </View>
            </GlassSurface>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  mapWrap: { flex: 1, overflow: "hidden" },
  sheet: {
    maxHeight: "42%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  sheetContent: { padding: spacing.lg, gap: spacing.sm },
  section: { letterSpacing: 1, marginBottom: spacing.xs },
  busCard: { padding: spacing.lg, borderRadius: radius.lg },
  busRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  etaBox: { alignItems: "center", minWidth: 52 },
});
