import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated as RNAnimated, Easing as RNEasing, StyleSheet, View } from "react-native";
import { AnimatedRegion, MarkerAnimated } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@ubts/shared";

interface BusMarkerProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
  /** Dimmed when the feed has gone stale, so a frozen bus reads as "stale". */
  stale?: boolean;
}

const GLIDE_MS = 1500;
const ROTATE_MS = 600;

/**
 * Google-Maps-grade directional bus marker.
 *
 *   1. Position glides between GPS fixes via AnimatedRegion (~1.5s) so the
 *      bus visibly moves across the map instead of teleporting between
 *      fixes.
 *   2. Heading is interpolated separately via an Animated.Value (~600ms,
 *      shortest-arc) so the marker SMOOTHLY rotates to its new direction
 *      instead of snapping — same feel as Google Maps Navigation when
 *      the road turns.
 *   3. Visual: a chunky white-bordered circle with a brand-coloured bus
 *      glyph in the middle and a LARGE forward-pointing chevron sitting
 *      on top. Because `flat=true` is set, the whole marker rotates with
 *      the map's coordinate space — and because the camera (in LiveMap)
 *      stays north-up, that rotation is what the rider sees as
 *      "direction the bus is going". The chevron is the dominant cue.
 *   4. A soft pulse halo behind the marker keeps it discoverable on
 *      busy maps without competing with the chevron for attention.
 *   5. `tracksViewChanges` is held TRUE during the glide and toggled off
 *      ~400 ms after it settles — otherwise Google Maps caches the
 *      marker's bitmap and motion looks frozen on Android.
 */
export function BusMarker({
  latitude,
  longitude,
  heading,
  stale = false,
}: BusMarkerProps) {
  // ── Position: AnimatedRegion glide ───────────────────────────────
  const coordinate = useMemo(
    () =>
      new AnimatedRegion({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [tracking, setTracking] = useState(true);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTracking(true);
    coordinate
      .timing({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: GLIDE_MS,
        useNativeDriver: false,
      } as never)
      .start();

    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setTracking(false), GLIDE_MS + 400);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [latitude, longitude, coordinate]);

  // ── Heading: smooth, shortest-arc rotation ───────────────────────
  // The raw heading from the server can jump (e.g. 350° → 10°). Naively
  // animating that goes the long way round. Track the last applied
  // heading and step the AnimatedValue along the SHORTER arc, so the
  // bus appears to make a small ±20° turn instead of a 340° spin.
  const targetHeading =
    heading != null && heading >= 0 && heading <= 360 ? heading : 0;
  const rotationAnim = useRef(new RNAnimated.Value(targetHeading)).current;
  const lastHeading = useRef<number>(targetHeading);

  useEffect(() => {
    const prev = lastHeading.current;
    let next = targetHeading;
    const diff = ((next - prev + 540) % 360) - 180; // signed, [-180, 180)
    // Drive the AnimatedValue past 360 in either direction if needed.
    const adjusted = prev + diff;
    RNAnimated.timing(rotationAnim, {
      toValue: adjusted,
      duration: ROTATE_MS,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: false,
    }).start(() => {
      lastHeading.current = ((adjusted % 360) + 360) % 360;
      // Snap the AnimatedValue back into [0, 360) range without
      // re-animating, so future deltas are computed from a clean base.
      rotationAnim.setValue(lastHeading.current);
    });
  }, [targetHeading, rotationAnim]);

  // ── Pulse halo ───────────────────────────────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.4 }],
    opacity: stale ? 0 : 0.45 * (1 - pulse.value),
  }));

  return (
    <MarkerAnimated
      coordinate={coordinate as unknown as { latitude: number; longitude: number }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      // RNAnimated.Value is accepted by Marker's `rotation` prop at
      // runtime; the type signature is plain number so we cast.
      rotation={rotationAnim as unknown as number}
      tracksViewChanges={tracking}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, pulseStyle]} />

        {/* FORWARD CHEVRON — the dominant direction cue, sits ahead
            of the bus body and points in the heading direction once
            the whole marker rotates. Bigger + brand-coloured + white
            stroke so it pops against any basemap. */}
        <View
          style={[
            styles.chevronStroke,
            stale && styles.chevronStrokeStale,
          ]}
        />
        <View
          style={[
            styles.chevronFill,
            stale && styles.chevronFillStale,
          ]}
        />

        {/* BUS BODY — circular badge with the bus icon. The "this is
            a bus, not just a moving dot" cue. */}
        <View style={[styles.body, stale && styles.bodyStale]}>
          <Ionicons name="bus" size={22} color="white" />
        </View>
      </View>
    </MarkerAnimated>
  );
}

const SIZE = 48;
const CONTAINER = SIZE * 3;
const CHEVRON_W = 30;
const CHEVRON_H = 24;
const CHEVRON_GAP = 8; // gap between bus body and chevron base
const CHEVRON_STROKE = 3; // white outline thickness for the chevron

const bodyTop = (CONTAINER - SIZE) / 2;
const chevronFillTop = bodyTop - CHEVRON_GAP - CHEVRON_H;
const chevronStrokeTop = chevronFillTop - CHEVRON_STROKE;

const styles = StyleSheet.create({
  container: {
    width: CONTAINER,
    height: CONTAINER,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: SIZE * 1.1,
    height: SIZE * 1.1,
    borderRadius: SIZE,
    backgroundColor: colors.primary,
  },
  // Bus body — round badge with brand fill, white border, deep shadow.
  body: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 10,
  },
  bodyStale: {
    backgroundColor: colors.faintForeground,
    borderColor: colors.muted,
  },
  // Forward chevron — large filled triangle pointing UP in marker
  // local space. Because `flat=true` rotates the whole marker, this
  // visually points "forward" relative to the bus's heading.
  //
  // We draw it as TWO stacked triangles: a slightly larger white
  // "stroke" triangle behind and a primary-coloured fill triangle
  // in front, giving the chevron a crisp outline on any basemap.
  chevronStroke: {
    position: "absolute",
    top: chevronStrokeTop,
    width: 0,
    height: 0,
    borderLeftWidth: CHEVRON_W / 2 + CHEVRON_STROKE,
    borderRightWidth: CHEVRON_W / 2 + CHEVRON_STROKE,
    borderBottomWidth: CHEVRON_H + CHEVRON_STROKE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffffff",
  },
  chevronStrokeStale: {
    borderBottomColor: colors.muted,
  },
  chevronFill: {
    position: "absolute",
    top: chevronFillTop,
    width: 0,
    height: 0,
    borderLeftWidth: CHEVRON_W / 2,
    borderRightWidth: CHEVRON_W / 2,
    borderBottomWidth: CHEVRON_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.primary,
  },
  chevronFillStale: {
    borderBottomColor: colors.faintForeground,
  },
});
