import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
} from "react-native-maps";
import { colors, env, MAP_STYLE_DARK } from "@ubts/shared";
import type { RoutePresentation } from "@ubts/shared";

interface Props {
  presentation: RoutePresentation | null;
  latitude: number | null;
  longitude: number | null;
}

export function DriverMap({ presentation, latitude, longitude }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [fitted, setFitted] = useState(false);

  // Re-fit when the route changes.
  useEffect(() => {
    setFitted(false);
  }, [presentation?.routeId]);

  useEffect(() => {
    if (fitted || !presentation || !mapRef.current) return;
    const coords = presentation.polyline.map(([la, lo]) => ({
      latitude: la,
      longitude: lo,
    }));
    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
        animated: true,
      });
      setFitted(true);
    }
  }, [presentation, fitted]);

  useEffect(() => {
    if (latitude == null || longitude == null || !mapRef.current) return;
    mapRef.current.animateCamera({ center: { latitude, longitude } }, { duration: 600 });
  }, [latitude, longitude]);

  const polyCoords = (presentation?.polyline ?? []).map(([la, lo]) => ({
    latitude: la,
    longitude: lo,
  }));

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE_DARK as unknown as MapStyleElement[]}
        initialRegion={{
          latitude: latitude ?? env.map.defaultLat,
          longitude: longitude ?? env.map.defaultLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
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
        {latitude != null && longitude != null && (
          <Marker
            coordinate={{ latitude, longitude }}
            title="Your bus"
            pinColor={colors.primary}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden" },
});
