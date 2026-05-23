import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  ScreenHeader,
  EmptyState,
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

function StarButton({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text variant="subtitle" color={active ? colors.warning : colors.faintForeground}>
        {active ? "★" : "☆"}
      </Text>
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
      // Optimistic; reconcile with the list the server returns.
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
    <Pressable
      key={row.routeId}
      onPress={() => navigate("routeDetail", { routeId: row.routeId, routeName: row.routeName })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowBody}>
        <Text variant="label" color={colors.foreground}>
          {row.routeName}
        </Text>
        <Text
          variant="caption"
          color={row.runningCount > 0 ? colors.success : colors.mutedForeground}
        >
          {row.runningCount > 0
            ? `${row.runningCount} bus${row.runningCount > 1 ? "es" : ""} running now`
            : "No buses running"}
        </Text>
      </View>
      <StarButton
        active={row.isFavorite}
        onPress={() => void toggleFavorite(row.routeId, row.isFavorite)}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Lines" onBack={goBack} />
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
            title="No routes yet"
            subtitle="Routes with a bus running now will appear here. Tap the star to save your lines."
          />
        ) : (
          <>
            {favoriteRows.length > 0 && (
              <>
                <Text variant="caption" color={colors.mutedForeground} style={styles.section}>
                  FAVORITES
                </Text>
                {favoriteRows.map(renderRow)}
              </>
            )}
            {runningRows.length > 0 && (
              <>
                <Text variant="caption" color={colors.mutedForeground} style={styles.section}>
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
  section: { marginTop: spacing.md, marginBottom: spacing.xs, letterSpacing: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
});
