import React, { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";
import { colors, useReduceMotion } from "@ubts/shared";
import { env } from "@ubts/shared";
import type {
  LiveBusLocation,
  PassengerLocation,
  RoutePresentation,
} from "@ubts/shared";
import { BusMarker } from "./BusMarker";

// Default region delta — wide enough that the bus, the route, and a few
// stops are visible together. We deliberately keep this looser than a
// navigation-app first-person view so motion is easy to see.
const DELTA = 0.025;

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

  // Camera behaviour:
  //   • While we have a live bus position → keep the camera centred on
  //     the bus with a top-down (0° pitch), north-up view at zoom 15.
  //     This is the **standard Google Maps look** — the world doesn't
  //     spin under the bus, so the bus marker visibly moves across the
  //     map as new fixes arrive. The passenger sees the same map UI they
  //     already know from Google Maps, just with a live bus on top.
  //   • While there's no bus yet → fit the route polyline into view so
  //     the passenger sees the whole journey before the live feed
  //     arrives.
  // User pan kills `following`, so they can explore the map freely.
  // Tapping the recenter FAB re-engages bus following.
  useEffect(() => {
    if (!following || !mapRef.current) return;

    if (live) {
      mapRef.current.animateCamera(
        {
          center: { latitude: live.latitude, longitude: live.longitude },
          pitch: 0,
          heading: 0,
          zoom: 15,
        },
        { duration: 800 },
      );
      return;
    }

    // No bus yet — fit the route into view so the passenger sees the
    // journey shape immediately.
    if (route?.polyline && route.polyline.length >= 2) {
      const coords = route.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 140, right: 70, bottom: 320, left: 70 },
        animated: true,
      });
    }
  }, [following, live, route, mapRef]);

  const polyline = useMemo(
    () =>
      route?.polyline.map(([latitude, longitude]) => ({
        latitude,
        longitude,
      })) ?? [],
    [route],
  );

  // Trail / breadcrumb — track the last ~12 GPS fixes the bus reported
  // and render them as a fading polyline behind the bus marker. This is
  // what sells the "live motion" feel: even between updates, the trail
  // shows where the bus just came from. Resets when the selected trip
  // (and therefore the route) changes.
  const TRAIL_MAX = 12;
  const [trail, setTrail] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const lastRouteId = useRef<string | null>(null);
  useEffect(() => {
    if (lastRouteId.current !== (route?.routeId ?? null)) {
      lastRouteId.current = route?.routeId ?? null;
      setTrail([]);
    }
  }, [route?.routeId]);
  useEffect(() => {
    if (!live) return;
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      // Don't add identical-coordinate updates — that'd just waste a slot.
      if (
        last &&
        last.latitude === live.latitude &&
        last.longitude === live.longitude
      ) {
        return prev;
      }
      const next = [
        ...prev,
        { latitude: live.latitude, longitude: live.longitude },
      ];
      return next.length > TRAIL_MAX ? next.slice(-TRAIL_MAX) : next;
    });
  }, [live]);

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
      // Standard Google Maps look — roads, labels, POIs, building outlines
      // in the colours every passenger already recognises. Hybrid view
      // remains opt-in via the layers FAB for satellite imagery.
      mapType={hybrid ? "hybrid" : "standard"}
      showsTraffic={showTraffic}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      showsBuildings
      showsIndoors={false}
      showsPointsOfInterest
      pitchEnabled
      rotateEnabled
      onPanDrag={onUserPan}
    >
      {/* Route polyline — premium two-layer rendering for prominence.
          Bottom: a dark/semi-transparent outline that gives the line
          a "lift" effect on light AND dark map styles. Top: the brand
          primary colour. The result reads like a real navigation route. */}
      {visiblePolyline.length > 1 && (
        <>
          <Polyline
            coordinates={visiblePolyline}
            strokeColor="rgba(0, 0, 0, 0.55)"
            strokeWidth={9}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
          <Polyline
            coordinates={visiblePolyline}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        </>
      )}

      {/* Vehicle trail — fading polyline behind the bus showing the last
          ~12 positions. Adds the "this is actually moving" feel between
          GPS fixes. Drawn AFTER the route so it sits on top of it but
          BEFORE the bus marker so the marker is the focal point. */}
      {trail.length > 1 && (
        <Polyline
          coordinates={trail}
          strokeColor="rgba(37, 99, 235, 0.65)"
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: colors.mutedForeground,
  },
  stopTerminal: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: "#ffffff",
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

