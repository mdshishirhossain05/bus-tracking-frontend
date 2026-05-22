import React, { useEffect, useMemo, type RefObject } from "react";
import { StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from "react-native-maps";
import { MAP_STYLE_DARK } from "../../../constants/mapStyleDark";
import { colors } from "../../../theme/tokens";
import { env } from "../../../config/env";
import type {
  LiveBusLocation,
  PassengerLocation,
  RoutePresentation,
} from "../../../types";
import { BusMarker } from "./BusMarker";

const DELTA = 0.022;

interface LiveMapProps {
  mapRef: RefObject<MapView | null>;
  live: LiveBusLocation | null;
  route: RoutePresentation | null;
  passenger: PassengerLocation | null;
  following: boolean;
  stale: boolean;
  onUserPan: () => void;
}

export function LiveMap({
  mapRef,
  live,
  route,
  passenger,
  following,
  stale,
  onUserPan,
}: LiveMapProps) {
  const initialRegion: Region = useMemo(() => {
    const lat = live?.latitude ?? route?.origin?.latitude ?? env.map.defaultLat;
    const lng =
      live?.longitude ?? route?.origin?.longitude ?? env.map.defaultLng;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: DELTA,
      longitudeDelta: DELTA,
    };
    // Only the first resolved center matters for the initial frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!following || !live) return;
    mapRef.current?.animateCamera(
      { center: { latitude: live.latitude, longitude: live.longitude } },
      { duration: 900 },
    );
  }, [following, live, mapRef]);

  const polyline = useMemo(
    () =>
      route?.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      })) ?? [],
    [route],
  );

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      customMapStyle={MAP_STYLE_DARK as unknown as MapStyleElement[]}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onPanDrag={onUserPan}
    >
      {polyline.length > 1 && (
        <Polyline
          coordinates={polyline}
          strokeColor={colors.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {route?.stops.map((stop) => {
        const terminal =
          stop.id === route.origin?.id || stop.id === route.destination?.id;
        return (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.stop, terminal && styles.stopTerminal]} />
          </Marker>
        );
      })}

      {passenger && (
        <Marker
          coordinate={{
            latitude: passenger.latitude,
            longitude: passenger.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.passengerRing}>
            <View style={styles.passengerDot} />
          </View>
        </Marker>
      )}

      {live && (
        <BusMarker
          latitude={live.latitude}
          longitude={live.longitude}
          heading={live.heading}
          stale={stale}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  stop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 2,
    borderColor: colors.mutedForeground,
  },
  stopTerminal: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderColor: colors.foreground,
    backgroundColor: colors.primary,
  },
  passengerRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(34, 197, 94, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: "#dcfce7",
  },
});
