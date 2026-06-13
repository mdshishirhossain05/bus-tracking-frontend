import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
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

/**
 * Bus marker for the live map.
 *   - Glides between GPS fixes via AnimatedRegion (~1.5s) so motion
 *     reads as continuous instead of teleporting between fixes.
 *   - `tracksViewChanges` is held TRUE during the glide and toggled
 *     back to FALSE once the marker settles. Holding it false the
 *     whole time (perf optimisation) is what was hiding movement on
 *     some Android builds — the marker's rendered bitmap was cached
 *     and Google Maps never repainted it as the coordinate animated.
 *   - The bus rotates to its heading. The camera stays north-up (set
 *     in LiveMap) so this rotation is genuinely visible — the bus icon
 *     points forward and the map keeps a familiar orientation.
 *   - Strong shadow + white border + soft pulse for visibility against
 *     the standard Google Maps look.
 */
export function BusMarker({
  latitude,
  longitude,
  heading,
  stale = false,
}: BusMarkerProps) {
  const coordinate = useMemo(
    () =>
      new AnimatedRegion({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }),
    // Construct once; subsequent fixes drive `timing()` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // `tracksViewChanges` toggle. Google Maps caches the marker's rendered
  // bitmap when this is false. We need it TRUE while we animate so the
  // marker actually repaints each frame, then flip it back to FALSE once
  // the glide settles to keep the map cheap when the bus is stationary.
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
    // Settle a touch after the glide ends to absorb back-to-back fixes
    // without churning tracksViewChanges.
    settleTimer.current = setTimeout(() => setTracking(false), GLIDE_MS + 400);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [latitude, longitude, coordinate]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.5 }],
    opacity: stale ? 0 : 0.55 * (1 - pulse.value),
  }));

  // Only rotate when heading is meaningful. Otherwise keep upright so the
  // bus glyph stays readable when the vehicle is stationary.
  const rotation = heading != null && heading >= 0 && heading <= 360 ? heading : 0;

  return (
    <MarkerAnimated
      coordinate={coordinate as unknown as { latitude: number; longitude: number }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={rotation}
      tracksViewChanges={tracking}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, pulseStyle]} />
        <View style={[styles.body, stale && styles.bodyStale]}>
          <View style={styles.iconWrap}>
            <Ionicons name="bus" size={20} color="white" />
          </View>
        </View>
        {/* Tiny direction triangle at the top — backup heading hint
            when the bus glyph itself isn't enough at distance. */}
        <View style={[styles.notch, stale && styles.notchStale]} />
      </View>
    </MarkerAnimated>
  );
}

const SIZE = 42;

const styles = StyleSheet.create({
  container: {
    width: SIZE * 2.8,
    height: SIZE * 2.8,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
  },
  body: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    // Strong shadow for prominence on the standard Google Maps look.
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
  iconWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  notch: {
    position: "absolute",
    top: (SIZE * 2.8 - SIZE) / 2 - 9,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffffff",
  },
  notchStale: { borderBottomColor: colors.muted },
});
