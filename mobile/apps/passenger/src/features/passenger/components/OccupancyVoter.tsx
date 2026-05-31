import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  spacing,
  radius,
  localizeNumber,
  useI18n,
  type IconName,
  type StatusBadgeTone,
  type OccupancyLevel,
  type OccupancyAggregate,
  type StringKey,
} from "@ubts/shared";

const OPTIONS: {
  level: OccupancyLevel;
  labelKey: StringKey;
  icon: IconName;
  tone: StatusBadgeTone;
}[] = [
  {
    level: "LIGHT",
    labelKey: "occupancy.light",
    icon: "leaf-outline",
    tone: "success",
  },
  {
    level: "MODERATE",
    labelKey: "occupancy.some",
    icon: "people-outline",
    tone: "info",
  },
  {
    level: "FULL",
    labelKey: "occupancy.full",
    icon: "warning-outline",
    tone: "delayed",
  },
];

interface OccupancyVoterProps {
  aggregate: OccupancyAggregate;
  onVote: (level: OccupancyLevel) => void;
  busy?: boolean;
}

export function OccupancyVoter({ aggregate, onVote, busy }: OccupancyVoterProps) {
  const { t, locale } = useI18n();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.mutedForeground}>
          {t("occupancy.howCrowded")}
        </Text>
        {aggregate.voteCount > 0 ? (
          <Text variant="caption" color={colors.faintForeground}>
            {t(
              aggregate.voteCount === 1
                ? "occupancy.voteCountOne"
                : "occupancy.voteCount",
              { n: localizeNumber(aggregate.voteCount, locale) },
            )}
          </Text>
        ) : null}
      </View>

      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const isMine = aggregate.myVote === opt.level;
          const isConsensus = aggregate.level === opt.level;
          const count = aggregate.counts[opt.level] ?? 0;
          const label = t(opt.labelKey);
          return (
            <Pressable
              key={opt.level}
              disabled={busy}
              onPress={() => onVote(opt.level)}
              accessibilityRole="button"
              accessibilityState={{ selected: isMine, disabled: !!busy }}
              accessibilityLabel={`${label}${
                count > 0
                  ? ` · ${localizeNumber(count, locale)}`
                  : ""
              }`}
              style={({ pressed }) => [
                styles.btn,
                isMine && styles.btnMine,
                pressed && styles.btnPressed,
              ]}
            >
              <Icon
                name={opt.icon}
                size={18}
                color={isMine ? colors.primaryForeground : colors.foreground}
              />
              <Text
                variant="label"
                color={
                  isMine ? colors.primaryForeground : colors.foreground
                }
              >
                {label}
              </Text>
              {count > 0 ? (
                <Text
                  variant="caption"
                  color={
                    isMine
                      ? colors.primaryForeground
                      : colors.mutedForeground
                  }
                >
                  {localizeNumber(count, locale)}
                </Text>
              ) : null}
              {isConsensus && !isMine ? (
                <View style={styles.consensusPip} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {aggregate.level ? (
        <View style={styles.summary}>
          <StatusBadge
            tone={
              aggregate.level === "FULL"
                ? "delayed"
                : aggregate.level === "MODERATE"
                  ? "info"
                  : "success"
            }
            label={
              aggregate.level === "FULL"
                ? t("occupancy.busFull")
                : aggregate.level === "MODERATE"
                  ? t("occupancy.someSeats")
                  : t("occupancy.plentyOfRoom")
            }
            withDot
          />
        </View>
      ) : null}
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
    justifyContent: "space-between",
  },
  row: { flexDirection: "row", gap: spacing.xs },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundElevated,
    position: "relative",
  },
  btnMine: { backgroundColor: colors.primary },
  btnPressed: { opacity: 0.8 },
  consensusPip: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  summary: { alignItems: "flex-start" },
});
