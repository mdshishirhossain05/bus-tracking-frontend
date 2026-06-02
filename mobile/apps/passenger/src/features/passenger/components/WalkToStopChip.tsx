import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  colors,
  radius,
  spacing,
  localizeNumber,
  useI18n,
} from "@ubts/shared";

interface WalkToStopChipProps {
  stopName: string | null;
  distanceMeters: number | null;
}

const WALK_SPEED_METERS_PER_MIN = 80; // ~4.8 km/h, comfortable walk
const HIDE_BELOW_METERS = 80; // user is essentially at the stop
const HIDE_ABOVE_METERS = 5_000; // 5 km — beyond comfortable walking

/**
 * Compact chip in the trip sheet that tells the passenger how long it
 * takes to walk to the nearest stop on the selected route.
 * Hides when the passenger is essentially at the stop (< 80 m) or
 * implausibly far away (> 5 km — they'd take a vehicle to the stop too).
 */
export function WalkToStopChip({
  stopName,
  distanceMeters,
}: WalkToStopChipProps) {
  const { t, locale } = useI18n();
  if (!stopName || distanceMeters == null) return null;
  if (distanceMeters < HIDE_BELOW_METERS) return null;
  if (distanceMeters > HIDE_ABOVE_METERS) return null;
  const minutes = Math.max(1, Math.round(distanceMeters / WALK_SPEED_METERS_PER_MIN));
  // "~" prefix when distance is large enough that the estimate is rough.
  const key = distanceMeters > 1_000 ? "walk.toStopFar" : "walk.toStop";
  return (
    <View style={styles.chip}>
      <Icon name="walk-outline" size={14} color={colors.success} />
      <Text variant="caption" color={colors.foreground}>
        {t(key, {
          n: localizeNumber(minutes, locale),
          stop: stopName,
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
  },
});
