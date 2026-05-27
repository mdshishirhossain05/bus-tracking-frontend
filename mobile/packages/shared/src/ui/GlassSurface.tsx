import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { colors, radius } from "../theme/tokens";

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  rounded?: keyof typeof radius;
}

/**
 * The app's core elevated surface — a frosted-glass panel mirroring the web
 * app's `.glass-panel` (translucent #111722 over a 14px blur).
 */
export function GlassSurface({
  children,
  style,
  intensity = 28,
  rounded = "lg",
}: GlassSurfaceProps) {
  return (
    <View style={[styles.wrap, { borderRadius: radius[rounded] }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius: radius[rounded] }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.tint,
          { borderRadius: radius[rounded] },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  tint: {
    backgroundColor: colors.glass,
  },
});
