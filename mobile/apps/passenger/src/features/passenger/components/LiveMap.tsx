import React, { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapStyleElement,
  type Region,
} from "react-native-maps";
import { MAP_STYLE_DARK } from "@ubts/shared";
import { colors, useReduceMotion } from "@ubts/shared";
import { env } from "@ubts/shared";
import type {
  LiveBusLocation,
  PassengerLocation,
  RoutePresentation,
} from "@ubts/shared";
import { BusMarker } from "./BusMarker";

// Default region delta — small enough that the bus and ~1-2 stops fit
// in view. Lower = more zoomed in.
const DELTA = 0.010;
// Pitch + altitude for the active follow camera. Lower altitude = more
// zoomed-in, more "in your face" view of the bus.
const FOLLOW_ALTITUDE = 1200; // meters
const FOLLOW_ZOOM = 16;       // Google Maps zoom level

interface LiveMapProps {
  mapRef: RefObject<MapView | null>;
  live: LiveBusLocation | null;
  route: RoutePresentation | null;
  passenger: PassengerLocation | null;
  following: boolean;
  stale: boolean;
  hybrid?: boolean;
  showTraffic?: boolean;
  onUserPan: () => void;
}

export function LiveMap({
  mapRef,
  live,
  route,
  passenger,
  following,
  stale,
  hybrid = false,
  showTraffic = false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the bus glued to the centre of the viewport whenever we're
  // in "follow" mode. We use animateCamera with an explicit zoom so the
  // view doesn't drift outward when the user has zoomed manually before.
  useEffect(() => {
    if (!following || !live) return;
    mapRef.current?.animateCamera(
      {
        center: { latitude: live.latitude, longitude: live.longitude },
        zoom: FOLLOW_ZOOM,
        altitude: FOLLOW_ALTITUDE,
        pitch: 0,
        heading: 0,
      },
      { duration: 700 },
    );
  }, [following, live, mapRef]);

  // When the route loads (no bus yet), fit the polyline into view so
  // the passenger can see the whole journey before the bus appears.
  useEffect(() => {
    if (live || !route || !mapRef.current) return;
    const coords = route.polyline.map(([latitude, longitude]) => ({
      latitude,
      longitude,
    }));
    if (coords.length < 2) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 80, bottom: 320, left: 80 },
      animated: true,
    });
  }, [live, route, mapRef]);

  const polyline = useMemo(
    () =>
      route?.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      })) ?? [],
    [route],
  );

  // Progressive draw-in for the route polyline. When the route id changes
  // we run a short animation that scales the rendered prefix from 1 point
  // to the full path so the route "draws itself" in instead of popping in
  // as a finished line. The Animated.Value listener updates state at most
  // ~30 times per animation — cheap enough on RN's UI thread.
  // Skipped when the OS reports "reduce motion" so accessibility-conscious
  // users see the route appear instantly.
  const reduceMotion = useReduceMotion();
  const drawAnim = useRef(new Animated.Value(0)).current;
  const [drawCount, setDrawCount] = useState(0);
  useEffect(() => {
    if (polyline.length === 0) {
      setDrawCount(0);
      return;
    }
    if (reduceMotion) {
      setDrawCount(polyline.length);
      return;
    }
    setDrawCount(1);
    drawAnim.setValue(0);
    const listener = drawAnim.addListener(({ value }) => {
      const next = Math.max(1, Math.round(value * polyline.length));
      setDrawCount(next);
    });
    Animated.timing(drawAnim, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => drawAnim.removeListener(listener);
  }, [route?.routeId, polyline.length, drawAnim, reduceMotion]);

  const visiblePolyline = useMemo(
    () => (drawCount >= polyline.length ? polyline : polyline.slice(0, drawCount)),
    [polyline, drawCount],
  );

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      mapType={hybrid ? "hybrid" : "standard"}
      showsTraffic={showTraffic}
      customMapStyle={
        hybrid ? [] : (MAP_STYLE_DARK as unknown as MapStyleElement[])
      }
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onPanDrag={onUserPan}
    >
      {/* Full route polyline — always drawn behind so the route is
          visible even before the draw-in animation completes. */}
      {polyline.length > 1 && (
        <Polyline
          coordinates={polyline}
          strokeColor={colors.primary}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
          geodesic
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
