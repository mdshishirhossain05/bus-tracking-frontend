import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { AnimatedRegion, MarkerAnimated } from "react-native-maps";
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

const GLIDE_MS = 1100;

/**
 * The bus glides between fixes (animated coordinate) instead of teleporting,
 * rotates to its heading, and carries a soft "live" pulse — the detail that
 * sells the real-time feel.
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
    // Construct once; subsequent fixes are animated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    coordinate
      // react-native-maps' AnimatedRegion.timing types intersect RN's
      // TimingAnimationConfig (which wants `toValue`); the real API takes the
      // target coordinate directly, so the cast is the documented workaround.
      .timing({
        latitude,
        longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: GLIDE_MS,
        useNativeDriver: false,
      } as never)
      .start();
  }, [latitude, longitude, coordinate]);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.6 }],
    opacity: stale ? 0 : 0.45 * (1 - pulse.value),
  }));

  return (
    <MarkerAnimated
      coordinate={coordinate as unknown as { latitude: number; longitude: number }}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={heading ?? 0}
      tracksViewChanges={false}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.pulse, pulseStyle]} />
        <View style={[styles.body, stale && styles.bodyStale]}>
          <View style={styles.heading} />
        </View>
      </View>
    </MarkerAnimated>
  );
}

const SIZE = 26;

const styles = StyleSheet.create({
  container: {
    width: SIZE * 3,
    height: SIZE * 3,
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
    borderWidth: 3,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bodyStale: {
    backgroundColor: colors.faintForeground,
    borderColor: colors.muted,
  },
  // A notch at the top points in the direction of travel (marker is rotated).
  heading: {
    position: "absolute",
    top: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#dbeafe",
  },
});
