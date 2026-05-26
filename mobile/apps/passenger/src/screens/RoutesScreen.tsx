import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  ScreenHeader,
  EmptyState,
  Icon,
  colors,
  spacing,
  radius,
} from "@ubts/shared";
import type { ActiveTrip, FavoriteRoute } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";
import { getActiveTrips } from "../features/passenger/api/passenger.api";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../features/passenger/api/favorites.api";

interface RouteRow {
  routeId: string;
  routeName: string;
  runningCount: number;
  isFavorite: boolean;
}

function RouteRowView({
  row,
  onPress,
  onToggleFavorite,
}: {
  row: RouteRow;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const running = row.runningCount > 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.leadIcon}>
        <Icon name="bus" size={20} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text variant="label" color={colors.foreground} numberOfLines={1}>
          {row.routeName}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: running ? colors.success : colors.faintForeground },
            ]}
          />
          <Text
            variant="caption"
            color={running ? colors.success : colors.mutedForeground}
          >
            {running
              ? `${row.runningCount} bus${row.runningCount > 1 ? "es" : ""} live now`
              : "No buses running"}
          </Text>
        </View>
      </View>
      <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.star}>
        <Icon
          name={row.isFavorite ? "star" : "star-outline"}
          size={20}
          color={row.isFavorite ? colors.warning : colors.faintForeground}
        />
      </Pressable>
      <Icon name="chevron-forward" size={18} color={colors.faintForeground} />
    </Pressable>
  );
}

export function RoutesScreen() {
  const { goBack, navigate } = useNav();
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [favs, active] = await Promise.all([
        getFavorites().catch(() => [] as FavoriteRoute[]),
        getActiveTrips().catch(() => [] as ActiveTrip[]),
      ]);
      setFavorites(favs);
      setTrips(active);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFavorite = useCallback(
    async (routeId: string, isFav: boolean) => {
      try {
        const next = isFav
          ? await removeFavorite(routeId)
          : await addFavorite(routeId);
        setFavorites(next);
      } catch {
        void load();
      }
    },
    [load],
  );

  const favIds = new Set(favorites.map((f) => f.routeId));
  const runningByRoute = new Map<string, { name: string; count: number }>();
  for (const t of trips) {
    if (!t.routeId) continue;
    const cur = runningByRoute.get(t.routeId);
    runningByRoute.set(t.routeId, {
      name: t.routeName ?? cur?.name ?? "Route",
      count: (cur?.count ?? 0) + 1,
    });
  }

  const favoriteRows: RouteRow[] = favorites.map((f) => ({
    routeId: f.routeId,
    routeName: f.routeName,
    runningCount: runningByRoute.get(f.routeId)?.count ?? 0,
    isFavorite: true,
  }));

  const runningRows: RouteRow[] = [...runningByRoute.entries()]
    .filter(([routeId]) => !favIds.has(routeId))
    .map(([routeId, v]) => ({
      routeId,
      routeName: v.name,
      runningCount: v.count,
      isFavorite: false,
    }));

  const isEmpty = !loading && favoriteRows.length === 0 && runningRows.length === 0;

  const renderRow = (row: RouteRow) => (
    <RouteRowView
      key={row.routeId}
      row={row}
      onPress={() => navigate("routeDetail", { routeId: row.routeId, routeName: row.routeName })}
      onToggleFavorite={() => void toggleFavorite(row.routeId, row.isFavorite)}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Lines" subtitle="Routes & live buses" onBack={goBack} />
      <ScrollView
        contentContainerStyle={isEmpty ? styles.emptyWrap : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={colors.primary}
          />
        }
      >
        {isEmpty ? (
          <EmptyState
            icon="bus-outline"
            title="No routes yet"
            subtitle="Lines with a bus running now appear here. Tap the star to save your routes."
          />
        ) : (
          <>
            {favoriteRows.length > 0 && (
              <>
                <Text variant="caption" color={colors.faintForeground} style={styles.section}>
                  FAVORITES
                </Text>
                {favoriteRows.map(renderRow)}
              </>
            )}
            {runningRows.length > 0 && (
              <>
                <Text variant="caption" color={colors.faintForeground} style={styles.section}>
                  RUNNING NOW
                </Text>
                {runningRows.map(renderRow)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  emptyWrap: { flexGrow: 1 },
  section: { letterSpacing: 1.2, marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  leadIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  star: { padding: spacing.xs },
  pressed: { opacity: 0.7 },
});
