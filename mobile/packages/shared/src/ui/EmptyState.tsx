import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme/tokens";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
}

export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Icon name={icon} size={28} color={colors.mutedForeground} />
        </View>
      ) : null}
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  center: { textAlign: "center" },
});
