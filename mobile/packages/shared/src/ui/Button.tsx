import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle | ViewStyle[];
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.muted,
  ghost: "transparent",
  danger: colors.danger,
};

const FG: Record<Variant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.foreground,
  ghost: colors.mutedForeground,
  danger: colors.primaryForeground,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG[variant] },
        variant === "ghost" && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={18} color={FG[variant]} /> : null}
          <Text variant="label" color={FG[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ghost: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
