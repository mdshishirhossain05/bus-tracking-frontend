import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import {
  Icon,
  Text,
  colors,
  fonts,
  radius,
  spacing,
} from "@ubts/shared";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
  label: string;
}

/**
 * Password input with a trailing eye-toggle to reveal what was typed.
 * Tapping the eye flips visibility; the icon swaps between
 * eye-outline (hidden) and eye-off-outline (visible).
 */
export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text variant="caption" color={colors.mutedForeground}>
        {label}
      </Text>
      <View style={styles.row}>
        <TextInput
          {...props}
          secureTextEntry={!visible}
          placeholderTextColor={colors.faintForeground}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          style={styles.eye}
        >
          <Icon
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  eye: {
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
