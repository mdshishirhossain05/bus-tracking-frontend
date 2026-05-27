import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Text, colors, spacing } from "@ubts/shared";

export function LiveIndicator({ live }: { live: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (live) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
    } else {
      pulse.value = 0;
    }
  }, [live, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 1.8 }],
    opacity: live ? 0.5 * (1 - pulse.value) : 0,
  }));

  return (
    <View style={styles.row}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.pulse, ringStyle]} />
        <View
          style={[
            styles.dot,
            { backgroundColor: live ? colors.success : colors.faintForeground },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text variant="title" color={live ? colors.foreground : colors.mutedForeground}>
          {live ? "LIVE" : "Not sharing"}
        </Text>
        <Text variant="caption" color={colors.mutedForeground}>
          {live
            ? "Passengers can see this bus moving"
            : "Start a trip to go live"}
        </Text>
      </View>
    </View>
  );
}

const DOT = 16;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  dotWrap: {
    width: DOT * 2,
    height: DOT * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.success,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 3,
    borderColor: colors.background,
  },
  labels: { flex: 1 },
});
