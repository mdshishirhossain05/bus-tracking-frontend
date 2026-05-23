import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme/tokens";
import { Text } from "./Text";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.side}>
          <Text variant="title" color={colors.foreground}>
            {"‹"}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text
        variant="subtitle"
        color={colors.foreground}
        style={styles.title}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  side: { minWidth: 36, height: 32, justifyContent: "center" },
  title: { flex: 1 },
  right: { alignItems: "flex-end" },
});
