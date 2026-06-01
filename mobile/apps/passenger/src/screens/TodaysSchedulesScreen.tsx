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
  type IconName,
  type ScheduleTodayItem,
  type ScheduleTodayStatus,
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
  items: ScheduleTodayItem[];
};

function formatTime12h(value: string): string {
  // value is HH:mm:ss in Dhaka local time.
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

function statusForItem(item: ScheduleTodayItem): {
  tone: StatusBadgeTone;
  labelKey: StringKey;
  withDot: boolean;
} | null {
  if (!item.trip) {
    const minsUntil = minutesUntil(item.departureAtIso);
    if (minsUntil < -5) {
      return { tone: "muted", labelKey: "today.passed", withDot: false };
    }
    return null;
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
  onTap,
  onToggleFavorite,
}: {
  item: ScheduleTodayItem;
  onTap: () => void;
  onToggleFavorite: () => void;
}) {
  const { t, locale } = useI18n();
  const status = statusForItem(item);
  const minsUntil = minutesUntil(item.departureAtIso);
  const showCountdown =
    item.trip == null && minsUntil > -5 && minsUntil < 180;
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
        const data = await getSchedulesToday();
        setItems(data);
        setError(null);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ??
            "Couldn't load today's schedules.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh once per minute so the countdown labels stay accurate
  // and status badges flip when pre-trip windows open / trips end.
  useEffect(() => {
    const id = setInterval(() => void load("refresh"), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const toggleFavorite = useCallback(async (item: ScheduleTodayItem) => {
    void Haptics.selectionAsync();
    // Optimistic flip.
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
      // Rollback.
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
    const live: ScheduleTodayItem[] = [];
    const preTrip: ScheduleTodayItem[] = [];
    const upcoming: ScheduleTodayItem[] = [];
    const completed: ScheduleTodayItem[] = [];

    for (const s of filtered) {
      const status = s.trip?.status;
      if (status === "RUNNING") live.push(s);
      else if (status === "PRE_TRIP") preTrip.push(s);
      else if (status === "ENDED") completed.push(s);
      else {
        // No trip yet → upcoming. Hide ones that departed more than 5 min
        // ago and never opened a trip (likely no-show or cancelled day).
        const minsUntil = minutesUntil(s.departureAtIso);
        if (minsUntil >= -5) upcoming.push(s);
      }
    }

    // Sort upcoming by time-to-departure (already mostly sorted by departureTime
    // from the API but re-sort to be sure across favorites pinning).
    upcoming.sort(
      (a, b) =>
        minutesUntil(a.departureAtIso) - minutesUntil(b.departureAtIso),
    );

    // Pin favourites to the top of upcoming.
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
    if (completed.length) {
      result.push({
        key: "completed",
        titleKey: "today.section.completed",
        items: completed,
      });
    }
    return result;
  }, [filtered]);

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
            title={
              search
                ? t("today.empty.searchTitle")
                : t("today.empty.title")
            }
            subtitle={
              search
                ? t("today.empty.searchSubtitle")
                : t("today.empty.subtitle")
            }
          />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text
                variant="caption"
                color={colors.mutedForeground}
                style={styles.sectionTitle}
              >
                {t(section.titleKey)}
              </Text>
              <View style={styles.list}>
                {section.items.map((item) => (
                  <ScheduleRow
                    key={item.scheduleId}
                    item={item}
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
