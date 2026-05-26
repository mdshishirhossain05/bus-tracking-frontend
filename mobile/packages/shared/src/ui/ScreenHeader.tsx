import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Text } from "./Text";
import { Icon } from "./Icon";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View style={styles.titles}>
        <Text variant="subtitle" color={colors.foreground} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={colors.mutedForeground} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
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
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  titles: { flex: 1 },
  right: { minWidth: 40, alignItems: "flex-end", justifyContent: "center" },
});
