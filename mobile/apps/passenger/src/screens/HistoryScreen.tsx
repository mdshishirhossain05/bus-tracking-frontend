import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Icon,
  IconButton,
  Skeleton,
  SkeletonGroup,
  EmptyState,
  StatusBadge,
  colors,
  radius,
  spacing,
  listVisitHistory,
  getVisitStats,
  localizeNumber,
  useI18n,
  type IconName,
  type Locale,
  type VisitRecord,
  type VisitStats,
} from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

function MetricCard({
  icon,
  value,
  unit,
  label,
}: {
  icon: IconName;
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <View style={styles.metric}>
      <Icon name={icon} size={16} color={colors.primary} />
      <View style={styles.metricValue}>
        <Text variant="title" color={colors.foreground} tabular>
          {value}
        </Text>
        {unit ? (
          <Text variant="caption" color={colors.mutedForeground}>
            {unit}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" color={colors.mutedForeground}>
        {label}
      </Text>
    </View>
  );
}

function formatDuration(seconds: number | null, locale: Locale): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${localizeNumber(seconds, locale)}s`;
  if (seconds < 3600) return `${localizeNumber(Math.round(seconds / 60), locale)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m
    ? `${localizeNumber(h, locale)}h ${localizeNumber(m, locale)}m`
    : `${localizeNumber(h, locale)}h`;
}

function formatWhen(
  iso: string,
  t: ReturnType<typeof useI18n>["t"],
  locale: Locale,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return t("history.justNow");
  if (diffMs < 3_600_000)
    return t("history.minAgo", {
      n: localizeNumber(Math.round(diffMs / 60_000), locale),
    });
  if (diffMs < 86_400_000)
    return t("history.hrAgo", {
      n: localizeNumber(Math.round(diffMs / 3_600_000), locale),
    });
  if (diffMs < 86_400_000 * 7)
    return t("history.dAgo", {
      n: localizeNumber(Math.round(diffMs / 86_400_000), locale),
    });
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US");
}

export function HistoryScreen() {
  const { goBack } = useNav();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [items, setItems] = useState<VisitRecord[]>([]);

  const load = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    try {
      const [s, list] = await Promise.all([
        getVisitStats(),
        listVisitHistory(),
      ]);
      setStats(s);
      setItems(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={goBack}
          accessibilityLabel={t("common.back")}
        />
        <Text variant="subtitle" color={colors.foreground}>
          {t("history.title")}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <SkeletonGroup gap={16}>
            <Skeleton width="100%" height={140} rounded="lg" />
            <Skeleton width="100%" height={200} rounded="lg" />
          </SkeletonGroup>
        ) : (
          <>
            <View style={styles.statsCard}>
              <Text variant="caption" color={colors.mutedForeground}>
                {t("history.last30Days")}
              </Text>
              <View style={styles.metrics}>
                <MetricCard
                  icon="bus"
                  value={localizeNumber(stats?.visitCount30Days ?? 0, locale)}
                  label={t("history.tripsTracked")}
                />
                <MetricCard
                  icon="git-network-outline"
                  value={localizeNumber(stats?.uniqueRoutes30Days ?? 0, locale)}
                  label={t("history.routes")}
                />
                <MetricCard
                  icon="time-outline"
                  value={localizeNumber(stats?.totalMinutesTracked ?? 0, locale)}
                  unit={t("common.min")}
                  label={t("history.timeTracked")}
                />
                <MetricCard
                  icon="flame-outline"
                  value={localizeNumber(stats?.longestStreakDays ?? 0, locale)}
                  unit={t("history.streakUnit")}
                  label={t("history.currentStreak")}
                />
              </View>

              {stats && stats.topRoutes.length > 0 ? (
                <View style={styles.topRoutes}>
                  <Text variant="caption" color={colors.mutedForeground}>
                    {t("history.topRoutes")}
                  </Text>
                  {stats.topRoutes.map((r) => (
                    <View key={r.routeId} style={styles.topRouteRow}>
                      <Text
                        variant="label"
                        color={colors.foreground}
                        numberOfLines={1}
                        style={styles.flex}
                      >
                        {r.routeName}
                      </Text>
                      <StatusBadge
                        tone="info"
                        label={t(
                          r.count === 1
                            ? "history.tripCountOne"
                            : "history.tripCount",
                          { n: localizeNumber(r.count, locale) },
                        )}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.listCard}>
              <Text variant="caption" color={colors.mutedForeground}>
                {t("history.recentVisits")}
              </Text>
              {items.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    icon="time-outline"
                    title={t("history.empty.title")}
                    subtitle={t("history.empty.subtitle")}
                  />
                </View>
              ) : (
                items.map((item, i) => (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      i === items.length - 1 && styles.rowLast,
                    ]}
                  >
                    <View style={styles.rowIcon}>
                      <Icon name="bus-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <Text
                        variant="label"
                        color={colors.foreground}
                        numberOfLines={1}
                      >
                        {item.routeName}
                      </Text>
                      <Text variant="caption" color={colors.mutedForeground}>
                        {formatWhen(item.visitedAt, t, locale)}
                      </Text>
                    </View>
                    <Text variant="caption" color={colors.mutedForeground}>
                      {formatDuration(item.durationSeconds, locale)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spacer: { width: 44 },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metric: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricValue: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  topRoutes: { gap: spacing.xs, paddingTop: spacing.sm },
  topRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  flex: { flex: 1 },
  listCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyWrap: { paddingVertical: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
