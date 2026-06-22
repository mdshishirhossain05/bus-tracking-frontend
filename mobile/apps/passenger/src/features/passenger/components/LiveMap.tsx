import React, { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
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
import { BusMarker, type BusMarkerStatus } from "./BusMarker";

// Default region delta — chosen to match the zoom we settle on once the
// bus position arrives (FOLLOW_ZOOM=17 ≈ ~0.005 delta). With the old
// 0.025 delta the first frame was district-wide and then snapped tight
// the moment the first fix arrived — a visible zoom-in that read as
// jank. Starting at the same close-in framing means the map opens at
// "navigation-app" zoom and stays there.
const DELTA = 0.005;

// Navigation-style follow camera. We keep the world north-up (so the bus
// marker visibly travels rather than the map spinning) but tighten the
// zoom and push the camera centre a little AHEAD of the bus along its
// heading, so the rider always sees the road the bus is about to take —
// the same "look-ahead" framing Google Maps navigation uses.
// Tighter than before (was 16) so road names and nearby cross-streets
// are legible — riders asked to see exactly which road the bus is on.
const FOLLOW_ZOOM = 17;
const LOOK_AHEAD_METERS = 240;

/** Returns a coordinate `meters` ahead of (lat,lng) along `headingDeg`. */
function offsetAhead(
  lat: number,
  lng: number,
  headingDeg: number,
  meters: number,
): { latitude: number; longitude: number } {
  const R = 6378137; // earth radius, metres
  const rad = (headingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / R;
  const dLng =
    (meters * Math.sin(rad)) / (R * Math.cos((lat * Math.PI) / 180));
  return {
    latitude: lat + (dLat * 180) / Math.PI,
    longitude: lng + (dLng * 180) / Math.PI,
  };
}

function metersBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6378137;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

interface LiveMapProps {
  mapRef: RefObject<MapView | null>;
  live: LiveBusLocation | null;
  route: RoutePresentation | null;
  passenger: PassengerLocation | null;
  following: boolean;
  stale: boolean;
  hybrid?: boolean;
  showTraffic?: boolean;
  /** Opt-in dark Google Maps style. Default is the standard bright look. */
  darkMap?: boolean;
  /** Short identifier for the selected bus (e.g. "BUS-1042"). Shown as a
   *  pill under the bus marker so riders can recognise their bus when
   *  multiple buses are on the same screen. */
  busLabel?: string | null;
  /** Name of the stop the bus is currently heading to. That stop's marker
   *  is rendered larger, in brand colour, with a label callout — so the
   *  rider sees the next stop on the MAP, not only in the sheet. */
  nextStopName?: string | null;
  /** Name of the rider's chosen destination stop, if any. Used to flag
   *  the next-stop pin as "your stop" on the map. */
  destinationStopName?: string | null;
  /** Live status shown in the callout attached to the bus marker. */
  busStatus?: BusMarkerStatus | null;
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
  darkMap = false,
  busLabel = null,
  nextStopName = null,
  destinationStopName = null,
  busStatus = null,
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
      // Push the camera centre ahead of the bus along its heading while
      // it's actually moving, so the rider sees the upcoming road. When
      // the bus is slow/stopped we centre on it so the view doesn't
      // drift off to empty road ahead.
      const speed =
        live.displaySpeedKmh ?? live.filteredSpeedKmh ?? live.speed ?? 0;
      const moving =
        speed != null && speed > 5 && live.heading != null && live.heading >= 0;
      const center = moving
        ? offsetAhead(
            live.latitude,
            live.longitude,
            live.heading as number,
            LOOK_AHEAD_METERS,
          )
        : { latitude: live.latitude, longitude: live.longitude };

      mapRef.current.animateCamera(
        {
          center,
          pitch: 0,
          heading: 0,
          zoom: FOLLOW_ZOOM,
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

  // Progress split — once the route has finished drawing in, find the
  // vertex on the polyline closest to the bus and split the line into
  // TRAVELED (behind, faded) and REMAINING (ahead, bright). As the bus
  // advances, the bright remaining line visibly shortens and the faded
  // traveled line grows — the core "the route is moving with the bus"
  // cue, exactly like a navigation app, with zero per-frame cost.
  const drawingIn = drawCount < polyline.length;
  const busIndex = useMemo(() => {
    if (!live || polyline.length < 2) return -1;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < polyline.length; i++) {
      const d = metersBetween(
        live.latitude,
        live.longitude,
        polyline[i].latitude,
        polyline[i].longitude,
      );
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    // If the bus is far from every vertex (off-route), don't split.
    return bestD <= 600 ? best : -1;
  }, [live, polyline]);

  const traveledLine = useMemo(
    () =>
      !drawingIn && busIndex > 0 ? polyline.slice(0, busIndex + 1) : [],
    [drawingIn, busIndex, polyline],
  );
  const remainingLine = useMemo(
    () => (!drawingIn && busIndex >= 0 ? polyline.slice(busIndex) : polyline),
    [drawingIn, busIndex, polyline],
  );
  // When we have a valid split, draw the two segments; otherwise fall
  // back to the single drawing-in line.
  const useSplit = !drawingIn && busIndex >= 0 && polyline.length > 1;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      // Default: the standard bright Google Maps look every passenger
      // already knows. Hybrid (satellite imagery) and a dark Google
      // Maps style are both opt-in via the layers FAB. Note that
      // satellite imagery in hybrid mode overrides custom map styles,
      // so we only apply the dark style when hybrid is off.
      mapType={hybrid ? "hybrid" : "standard"}
      showsTraffic={showTraffic}
      customMapStyle={
        !hybrid && darkMap
          ? (MAP_STYLE_DARK as unknown as MapStyleElement[])
          : undefined
      }
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      showsBuildings
      showsIndoors={false}
      showsPointsOfInterests
      pitchEnabled
      rotateEnabled
      // Pan breaks follow immediately (fires mid-drag). Pinch-zoom and
      // two-finger rotate don't fire onPanDrag, so we also catch any
      // user gesture on region-change-complete — `isGesture` is false
      // for our own animateCamera calls, so following the bus doesn't
      // fight itself.
      onPanDrag={onUserPan}
      onRegionChangeComplete={(_region, details) => {
        if (details?.isGesture) onUserPan();
      }}
    >
      {/* Route polyline.
          • During the initial draw-in: a single premium two-layer line
            (dark casing + brand fill) that "draws itself" along the path.
          • Once drawn: a navigation-style PROGRESS split — the travelled
            portion behind the bus is faded/grey, the remaining portion
            ahead is the bright brand line with a white dashed direction
            overlay. The split point rides with the bus, so the route
            visibly advances as the bus moves. */}
      {!useSplit && visiblePolyline.length > 1 && (
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

      {useSplit && traveledLine.length > 1 && (
        <Polyline
          coordinates={traveledLine}
          strokeColor="rgba(100, 116, 139, 0.45)"
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
          geodesic
        />
      )}

      {useSplit && remainingLine.length > 1 && (
        <>
          {/* casing */}
          <Polyline
            coordinates={remainingLine}
            strokeColor="rgba(0, 0, 0, 0.55)"
            strokeWidth={9}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
          {/* bright brand fill */}
          <Polyline
            coordinates={remainingLine}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
          {/* white dashed direction overlay — gives the upcoming route a
              navigation-route texture pointing the way ahead. */}
          <Polyline
            coordinates={remainingLine}
            strokeColor="rgba(255, 255, 255, 0.9)"
            strokeWidth={2.5}
            lineCap="butt"
            lineJoin="round"
            lineDashPattern={[10, 14]}
            geodesic
          />
        </>
      )}

      {/* Vehicle trail — fading polyline behind the bus showing the last
          ~12 positions. Adds the "this is actually moving" feel between
          GPS fixes. Drawn AFTER the route so it sits on top of it but
          BEFORE the bus marker so the marker is the focal point. White
          on the dark map style, brand-blue on the bright standard map. */}
      {trail.length > 1 && (
        <Polyline
          coordinates={trail}
          strokeColor={
            !hybrid && darkMap
              ? "rgba(255, 255, 255, 0.85)"
              : "rgba(37, 99, 235, 0.65)"
          }
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {route?.stops.map((stop) => {
        const terminal =
          stop.id === route.origin?.id || stop.id === route.destination?.id;
        const darkBasemap = !hybrid && darkMap;
        const isNext =
          !!nextStopName &&
          stop.name.trim().toLowerCase() === nextStopName.trim().toLowerCase();
        const isYourStop =
          !!destinationStopName &&
          stop.name.trim().toLowerCase() ===
            destinationStopName.trim().toLowerCase();

        // The NEXT stop gets a larger, brand-coloured pin with a label
        // callout so the rider can see — on the map itself — exactly which
        // stop the bus is heading to next. When that stop is also the
        // rider's chosen destination it switches to the "your stop"
        // success colour. tracksViewChanges stays true for this one
        // marker so the label re-renders when the next stop changes; the
        // rest stay cached (false) for performance.
        if (isNext) {
          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
              zIndex={50}
            >
              <View style={styles.nextStopWrap}>
                <View
                  style={[
                    styles.nextStopLabel,
                    isYourStop && styles.nextStopLabelYour,
                  ]}
                >
                  <Text style={styles.nextStopLabelText} numberOfLines={1}>
                    {isYourStop ? `★ ${stop.name}` : stop.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.nextStopPin,
                    isYourStop && styles.nextStopPinYour,
                  ]}
                />
              </View>
            </Marker>
          );
        }

        return (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.stop,
                darkBasemap && styles.stopOnDark,
                terminal && styles.stopTerminal,
              ]}
            />
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
          speedKmh={
            live.displaySpeedKmh ??
            live.filteredSpeedKmh ??
            live.speed ??
            null
          }
          label={busLabel}
          stale={stale}
          status={busStatus}
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
  // Slightly invert the contrast on the dark Google Maps style so the
  // stop dot still pops against a near-black basemap.
  stopOnDark: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.foreground,
  },
  stopTerminal: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: "#ffffff",
    backgroundColor: colors.primary,
  },
  // Next-stop pin: a labelled, brand-coloured teardrop the rider sees
  // on the map itself, marking exactly where the bus is heading next.
  nextStopWrap: {
    alignItems: "center",
  },
  nextStopLabel: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nextStopLabelYour: {
    backgroundColor: colors.success,
  },
  nextStopPinYour: {
    backgroundColor: colors.success,
  },
  nextStopLabelText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  nextStopPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: "#ffffff",
    marginTop: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 6,
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

