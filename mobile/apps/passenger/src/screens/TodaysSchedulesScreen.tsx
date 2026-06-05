import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
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
  fonts,
  localizeNumber,
  useI18n,
  type ScheduleDayType,
  type ScheduleScope,
  type ScheduleTodayItem,
  type StatusBadgeTone,
  type StringKey,
} from "@ubts/shared";
import {
  addFavorite,
  removeFavorite,
} from "../features/passenger/api/favorites.api";
import { getSchedulesToday } from "../features/passenger/api/passenger.api";
import { useNav } from "../navigation/NavigationContext";

type Section = {
  key: string;
  titleKey: StringKey;
  /** Optional literal title — used for day-of-week groupings. */
  title?: string;
  items: ScheduleTodayItem[];
};

const TABS: { key: ScheduleScope; labelKey: StringKey }[] = [
  { key: "today", labelKey: "today.tab.today" },
  { key: "tomorrow", labelKey: "today.tab.tomorrow" },
  { key: "all", labelKey: "today.tab.all" },
];

const DOW_LABEL_KEYS: Record<ScheduleDayType, StringKey> = {
  SUNDAY: "today.dow.SUNDAY",
  MONDAY: "today.dow.MONDAY",
  TUESDAY: "today.dow.TUESDAY",
  WEDNESDAY: "today.dow.WEDNESDAY",
  THURSDAY: "today.dow.THURSDAY",
  FRIDAY: "today.dow.FRIDAY",
  SATURDAY: "today.dow.SATURDAY",
};

const DOW_ORDER: ScheduleDayType[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function formatTime12h(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;
  const h = Number(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${period}`;
}

function minutesUntil(departureAtIso: string): number {
  const t = new Date(departureAtIso).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.round((t - Date.now()) / 60_000);
}

function statusForItem(
  item: ScheduleTodayItem,
  scope: ScheduleScope,
): {
  tone: StatusBadgeTone;
  labelKey: StringKey;
  withDot: boolean;
} | null {
  if (scope !== "today") return null;
  if (!item.trip) {
    const minsUntil = minutesUntil(item.departureAtIso);
    if (minsUntil < -5) {
      // Past scheduled departure with no trip started — make it visible
      // so the passenger isn't waiting in confusion.
      return { tone: "delayed", labelKey: "today.badge.delayed", withDot: true };
    }
    return { tone: "muted", labelKey: "today.badge.notLive", withDot: false };
  }
  switch (item.trip.status) {
    case "RUNNING":
      return { tone: "live", labelKey: "badge.live", withDot: true };
    case "PRE_TRIP":
      return { tone: "preTrip", labelKey: "badge.preTrip", withDot: true };
    case "ENDED":
      return { tone: "ended", labelKey: "badge.ended", withDot: false };
    default:
      return null;
  }
}

function ScheduleRow({
  item,
  scope,
  onTap,
  onToggleFavorite,
}: {
  item: ScheduleTodayItem;
  scope: ScheduleScope;
  onTap: () => void;
  onToggleFavorite: () => void;
}) {
  const { t, locale } = useI18n();
  const status = statusForItem(item, scope);
  const minsUntil = minutesUntil(item.departureAtIso);
  const showCountdown =
    scope === "today" && item.trip == null && minsUntil > -5 && minsUntil < 180;
  const countdownText =
    showCountdown && minsUntil <= 0
      ? t("today.now")
      : showCountdown
        ? t("today.inMinutes", { n: localizeNumber(minsUntil, locale) })
        : null;

  const subtitle = item.driverName ?? t("today.driverNotAssigned");
  const eta = item.trip?.lastEtaMinutes;
  const etaText =
    item.trip?.status === "RUNNING" && eta != null && eta >= 0
      ? `${localizeNumber(eta, locale)} ${t("common.min")}`
      : null;

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.routeName} at ${formatTime12h(item.departureTime)}`}
    >
      <View style={styles.timeCol}>
        <Text variant="subtitle" color={colors.foreground} tabular>
          {locale === "bn"
            ? localizeNumber(item.departureTime.slice(0, 5), locale)
            : item.departureTime.slice(0, 5)}
        </Text>
        <Text variant="caption" color={colors.faintForeground}>
          {formatTime12h(item.departureTime).slice(-2)}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.row1}>
          <Text
            variant="label"
            color={colors.foreground}
            numberOfLines={1}
            style={styles.flex}
          >
            {item.routeName}
          </Text>
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ selected: item.isFavorite }}
            accessibilityLabel={item.routeName}
          >
            <Icon
              name={item.isFavorite ? "star" : "star-outline"}
              size={18}
              color={
                item.isFavorite ? colors.warning : colors.mutedForeground
              }
            />
          </Pressable>
        </View>
        <View style={styles.row2}>
          <View style={styles.busPill}>
            <Icon
              name="bus-outline"
              size={12}
              color={colors.mutedForeground}
            />
            <Text variant="caption" color={colors.mutedForeground}>
              {item.busLabel}
            </Text>
          </View>
          <Text
            variant="caption"
            color={colors.mutedForeground}
            numberOfLines={1}
            style={styles.flex}
          >
            {subtitle}
          </Text>
        </View>
        <View style={styles.row3}>
          {status ? (
            <StatusBadge
              tone={status.tone}
              label={t(status.labelKey)}
              withDot={status.withDot}
            />
          ) : null}
          {countdownText ? (
            <Text variant="caption" color={colors.primary}>
              {countdownText}
            </Text>
          ) : null}
          {etaText ? (
            <Text variant="caption" color={colors.foreground}>
              ETA {etaText}
            </Text>
          ) : null}
        </View>
      </View>

      <Icon
        name="chevron-forward"
        size={18}
        color={colors.faintForeground}
      />
    </Pressable>
  );
}

export function TodaysSchedulesScreen() {
  const { goBack, navigate } = useNav();
  const { t } = useI18n();
  const [scope, setScope] = useState<ScheduleScope>("today");
  const [items, setItems] = useState<ScheduleTodayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      try {
        const data = await getSchedulesToday(scope);
        setItems(data);
        setError(null);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ?? "Couldn't load schedules.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [scope],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh once per minute on TODAY so countdowns + statuses stay
  // accurate. Tomorrow / All don't need this — they don't have live data.
  useEffect(() => {
    if (scope !== "today") return;
    const id = setInterval(() => void load("refresh"), 60_000);
    return () => clearInterval(id);
  }, [load, scope]);

  const toggleFavorite = useCallback(async (item: ScheduleTodayItem) => {
    void Haptics.selectionAsync();
    setItems((prev) =>
      prev.map((s) =>
        s.routeId === item.routeId
          ? { ...s, isFavorite: !item.isFavorite }
          : s,
      ),
    );
    try {
      if (item.isFavorite) {
        await removeFavorite(item.routeId);
      } else {
        await addFavorite(item.routeId);
      }
    } catch {
      setItems((prev) =>
        prev.map((s) =>
          s.routeId === item.routeId
            ? { ...s, isFavorite: item.isFavorite }
            : s,
        ),
      );
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (s) =>
        s.routeName.toLowerCase().includes(q) ||
        s.busLabel.toLowerCase().includes(q) ||
        (s.driverName?.toLowerCase().includes(q) ?? false),
    );
  }, [items, search]);

  const sections = useMemo<Section[]>(() => {
    if (scope === "all") {
      // Group by day-of-week, ordered Sun..Sat.
      const groups = new Map<ScheduleDayType, ScheduleTodayItem[]>();
      for (const s of filtered) {
        const list = groups.get(s.dayType) ?? [];
        list.push(s);
        groups.set(s.dayType, list);
      }
      const result: Section[] = [];
      for (const dow of DOW_ORDER) {
        const list = groups.get(dow);
        if (!list || list.length === 0) continue;
        result.push({
          key: `dow:${dow}`,
          titleKey: DOW_LABEL_KEYS[dow],
          items: list,
        });
      }
      return result;
    }

    if (scope === "tomorrow") {
      // Tomorrow has no trips — just one big sorted list under "Upcoming".
      const upcoming = [...filtered].sort((a, b) =>
        a.departureTime.localeCompare(b.departureTime),
      );
      if (upcoming.length === 0) return [];
      return [
        {
          key: "tomorrow",
          titleKey: "today.section.upcoming",
          items: upcoming,
        },
      ];
    }

    // scope === "today" — group by lifecycle so the user can scan the day.
    const live: ScheduleTodayItem[] = [];
    const preTrip: ScheduleTodayItem[] = [];
    const upcoming: ScheduleTodayItem[] = [];
    const notLiveYet: ScheduleTodayItem[] = []; // past departure, no trip yet
    const completed: ScheduleTodayItem[] = [];

    for (const s of filtered) {
      const status = s.trip?.status;
      if (status === "RUNNING") live.push(s);
      else if (status === "PRE_TRIP") preTrip.push(s);
      else if (status === "ENDED") completed.push(s);
      else {
        const minsUntil = minutesUntil(s.departureAtIso);
        // Future / starting-soon → "Upcoming". Past with no trip → "Not live
        // yet" so the passenger still sees the schedule and knows it's
        // delayed (instead of it silently disappearing).
        if (minsUntil >= -5) upcoming.push(s);
        else notLiveYet.push(s);
      }
    }

    upcoming.sort(
      (a, b) =>
        minutesUntil(a.departureAtIso) - minutesUntil(b.departureAtIso),
    );
    notLiveYet.sort((a, b) =>
      a.departureTime.localeCompare(b.departureTime),
    );

    const upcomingFav = upcoming.filter((s) => s.isFavorite);
    const upcomingRest = upcoming.filter((s) => !s.isFavorite);

    const result: Section[] = [];
    if (live.length) {
      result.push({ key: "live", titleKey: "today.section.live", items: live });
    }
    if (preTrip.length) {
      result.push({
        key: "preTrip",
        titleKey: "today.section.preTrip",
        items: preTrip,
      });
    }
    if (upcomingFav.length || upcomingRest.length) {
      result.push({
        key: "upcoming",
        titleKey: "today.section.upcoming",
        items: [...upcomingFav, ...upcomingRest],
      });
    }
    if (notLiveYet.length) {
      result.push({
        key: "notLiveYet",
        titleKey: "today.section.notLive",
        items: notLiveYet,
      });
    }
    if (completed.length) {
      result.push({
        key: "completed",
        titleKey: "today.section.completed",
        items: completed,
      });
    }
    return result;
  }, [filtered, scope]);

  const emptyTitle =
    scope === "tomorrow"
      ? t("today.empty.tomorrow.title")
      : scope === "all"
        ? t("today.empty.all.title")
        : search
          ? t("today.empty.searchTitle")
          : t("today.empty.title");
  const emptySubtitle =
    scope === "tomorrow"
      ? t("today.empty.tomorrow.subtitle")
      : scope === "all"
        ? t("today.empty.all.subtitle")
        : search
          ? t("today.empty.searchSubtitle")
          : t("today.empty.subtitle");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={goBack}
          accessibilityLabel={t("common.back")}
        />
        <Text variant="subtitle" color={colors.foreground}>
          {t("today.title")}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = scope === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (scope !== tab.key) {
                  void Haptics.selectionAsync();
                  setScope(tab.key);
                }
              }}
              style={[styles.tab, active && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                variant="label"
                color={active ? colors.primaryForeground : colors.foreground}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchWrap}>
        <Icon name="search" size={16} color={colors.faintForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("today.searchPlaceholder")}
          placeholderTextColor={colors.faintForeground}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search ? (
          <Pressable
            onPress={() => setSearch("")}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="clear"
          >
            <Icon
              name="close-circle"
              size={16}
              color={colors.faintForeground}
            />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <SkeletonGroup gap={12}>
            <Skeleton width="40%" height={14} />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={88} rounded="lg" />
            ))}
          </SkeletonGroup>
        ) : sections.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={emptyTitle}
            subtitle={emptySubtitle}
          />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text
                variant="caption"
                color={colors.mutedForeground}
                style={styles.sectionTitle}
              >
                {section.title ?? t(section.titleKey)}
              </Text>
              <View style={styles.list}>
                {section.items.map((item) => (
                  <ScheduleRow
                    key={item.scheduleId}
                    item={item}
                    scope={scope}
                    onTap={() =>
                      navigate("routeDetail", {
                        routeId: item.routeId,
                        routeName: item.routeName,
                      })
                    }
                    onToggleFavorite={() => void toggleFavorite(item)}
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {error ? (
          <Text variant="caption" color={colors.danger} style={styles.center}>
            {error}
          </Text>
        ) : null}
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
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: { gap: spacing.xs },
  sectionTitle: { letterSpacing: 1.2 },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowPressed: { opacity: 0.85 },
  timeCol: { alignItems: "center", minWidth: 56 },
  body: { flex: 1, gap: spacing.xs },
  row1: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row2: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row3: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  flex: { flex: 1 },
  busPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.muted,
    borderRadius: radius.pill,
  },
  center: { textAlign: "center" },
});
