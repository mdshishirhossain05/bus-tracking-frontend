import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { colors } from "../theme/tokens";
import { Icon, type IconName } from "./Icon";
import { Badge } from "./Badge";

interface IconButtonProps {
  name: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  badge?: number;
  /** Set to false to suppress the default selection haptic. */
  haptic?: boolean;
}

/** A circular frosted-glass button — the app's primary floating control. */
export function IconButton({
  name,
  onPress,
  size = 44,
  iconSize = 20,
  color = colors.foreground,
  badge,
  haptic = true,
}: IconButtonProps) {
  const r = size / 2;
  const handlePress = useCallback(() => {
    if (haptic) void Haptics.selectionAsync();
    onPress?.();
  }, [onPress, haptic]);
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <View style={[styles.wrap, { width: size, height: size, borderRadius: r }]}>
        <BlurView
          intensity={28}
          tint="dark"
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        />
        <View style={[StyleSheet.absoluteFill, styles.tint, { borderRadius: r }]} />
        <Icon name={name} size={iconSize} color={color} />
      </View>
      {badge ? <Badge count={badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  tint: { backgroundColor: colors.glass },
  pressed: { opacity: 0.7 },
});
