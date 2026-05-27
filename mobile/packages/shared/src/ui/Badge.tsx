import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "../theme/tokens";
import { Text } from "./Text";

export function Badge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text variant="caption" color={colors.primaryForeground} style={styles.text}>
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 10, lineHeight: 14 },
});
