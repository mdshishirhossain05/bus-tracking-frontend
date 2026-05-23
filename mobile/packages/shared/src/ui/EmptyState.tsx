import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme/tokens";
import { Text } from "./Text";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="subtitle" color={colors.foreground} style={styles.center}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color={colors.mutedForeground} style={styles.center}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  center: { textAlign: "center" },
});
