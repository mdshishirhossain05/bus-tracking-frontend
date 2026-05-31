import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius } from "../theme/tokens";

interface SkeletonProps {
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  rounded?: keyof typeof radius | number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * A shimmering placeholder block. Replaces ActivityIndicator spinners in
 * loading states so the screen feels intentional rather than empty.
 * Animates with the built-in RN `Animated` driver so the shared package
 * stays free of reanimated as a hard dep.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "sm",
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const borderRadius =
    typeof rounded === "number" ? rounded : radius[rounded];

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}

export function SkeletonGroup({
  children,
  gap = 12,
  style,
}: SkeletonGroupProps) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.muted,
  },
});
