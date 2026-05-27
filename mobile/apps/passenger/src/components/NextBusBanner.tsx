import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GlassSurface, Text, Icon, colors, spacing, radius } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";
import { useNextBus } from "../features/journey/useNextBus";
import { SourceChip } from "./SourceChip";

export function NextBusBanner() {
  const next = useNextBus();
  const { navigate } = useNav();
  if (!next) return null;

  const approaching = next.journey.state === "approaching";
  return (
    <Pressable
      onPress={() =>
        navigate("routeDetail", {
          routeId: next.routeId,
          routeName: next.routeName,
        })
      }
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <GlassSurface style={styles.card}>
        <View style={styles.iconWrap}>
          <Icon name="bus" size={18} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="caption" color={colors.mutedForeground} numberOfLines={1}>
            {next.routeName} · {next.stopName}
          </Text>
          <Text
            variant="label"
            color={approaching ? colors.success : colors.foreground}
            numberOfLines={1}
          >
            {approaching ? "Arriving now" : next.journey.headline}
          </Text>
          <SourceChip bus={next.bus} />
        </View>
        <Icon name="chevron-forward" size={18} color={colors.mutedForeground} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1, gap: 1 },
});
