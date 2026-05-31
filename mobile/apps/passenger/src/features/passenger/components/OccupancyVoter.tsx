import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Text,
  Icon,
  StatusBadge,
  colors,
  spacing,
  radius,
  type IconName,
  type StatusBadgeTone,
  type OccupancyLevel,
  type OccupancyAggregate,
} from "@ubts/shared";

const OPTIONS: {
  level: OccupancyLevel;
  label: string;
  icon: IconName;
  tone: StatusBadgeTone;
}[] = [
  { level: "LIGHT", label: "Light", icon: "leaf-outline", tone: "success" },
  {
    level: "MODERATE",
    label: "Some",
    icon: "people-outline",
    tone: "info",
  },
  { level: "FULL", label: "Full", icon: "warning-outline", tone: "delayed" },
];

interface OccupancyVoterProps {
  aggregate: OccupancyAggregate;
  onVote: (level: OccupancyLevel) => void;
  busy?: boolean;
}

export function OccupancyVoter({ aggregate, onVote, busy }: OccupancyVoterProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.mutedForeground}>
          HOW CROWDED?
        </Text>
        {aggregate.voteCount > 0 ? (
          <Text variant="caption" color={colors.faintForeground}>
            {aggregate.voteCount} vote{aggregate.voteCount === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const isMine = aggregate.myVote === opt.level;
          const isConsensus = aggregate.level === opt.level;
          const count = aggregate.counts[opt.level] ?? 0;
          return (
            <Pressable
              key={opt.level}
              disabled={busy}
              onPress={() => onVote(opt.level)}
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
                {opt.label}
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
                  {count}
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
                ? "Bus is full"
                : aggregate.level === "MODERATE"
                  ? "Some seats left"
                  : "Plenty of room"
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
