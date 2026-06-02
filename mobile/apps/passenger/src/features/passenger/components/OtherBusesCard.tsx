import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  radius,
  spacing,
  localizeNumber,
  useI18n,
  type RouteLiveBus,
} from "@ubts/shared";

interface OtherBusesCardProps {
  buses: RouteLiveBus[];
  selectedTripId: string;
  onSelect: (tripId: string) => void;
}

/**
 * Comparison card showing every OTHER active bus on the same route as
 * the selected trip. Sorted by ETA-to-next-stop ascending so the
 * "best next bus" surfaces first.
 *
 * Hides itself entirely when the only running bus is the one already
 * selected — no point showing a card with no rows.
 */
export function OtherBusesCard({
  buses,
  selectedTripId,
  onSelect,
}: OtherBusesCardProps) {
  const { t, locale } = useI18n();

  const others = useMemo(() => {
    return buses
      .filter((b) => b.tripId && b.tripId !== selectedTripId)
      .sort((a, b) => {
        const ea = a.etaMinutes ?? Number.POSITIVE_INFINITY;
        const eb = b.etaMinutes ?? Number.POSITIVE_INFINITY;
        return ea - eb;
      });
  }, [buses, selectedTripId]);

  if (others.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="git-compare-outline" size={14} color={colors.mutedForeground} />
        <Text variant="caption" color={colors.mutedForeground}>
          {t("otherBuses.title")}
        </Text>
      </View>
      <View style={styles.list}>
        {others.map((bus) => (
          <Pressable
            key={bus.tripId}
            onPress={() => onSelect(bus.tripId)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${bus.busLabel ?? "Bus"} ${
              bus.etaMinutes != null ? `${bus.etaMinutes} min` : ""
            }`}
          >
            <View style={styles.busPill}>
              <Icon name="bus" size={12} color={colors.primary} />
              <Text variant="caption" color={colors.foreground}>
                {bus.busLabel ?? "Bus"}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text
                variant="caption"
                color={colors.mutedForeground}
                numberOfLines={1}
              >
                {bus.nextStopName ?? t("otherBuses.tapHint")}
              </Text>
            </View>
            {bus.etaMinutes != null && bus.etaMinutes >= 0 ? (
              <StatusBadge
                tone="info"
                label={`${localizeNumber(bus.etaMinutes, locale)} ${t("common.min")}`}
              />
            ) : (
              <Text variant="caption" color={colors.faintForeground}>
                {t("otherBuses.noEta")}
              </Text>
            )}
            <Icon
              name="chevron-forward"
              size={14}
              color={colors.faintForeground}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  list: { gap: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
  },
  rowPressed: { opacity: 0.85 },
  busPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
  },
  flex: { flex: 1 },
});
