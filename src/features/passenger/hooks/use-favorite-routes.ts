"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addFavoriteRoute,
  getFavoriteRoutes,
  removeFavoriteRoute,
  type FavoriteRoute,
} from "@/features/passenger/api/favorites.api";

export function useFavoriteRoutes() {
  const [favorites, setFavorites] = useState<FavoriteRoute[]>([]);
  const [pendingRouteId, setPendingRouteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getFavoriteRoutes()
      .then((items) => {
        if (active) setFavorites(items);
      })
      .catch(() => {
        // Favorites are non-critical; tracking still works without them.
      });

    return () => {
      active = false;
    };
  }, []);

  const favoriteRouteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.routeId)),
    [favorites],
  );

  const toggleFavorite = useCallback(
    async (routeId: string) => {
      if (!routeId || pendingRouteId) return;

      setPendingRouteId(routeId);
      const isFavorite = favoriteRouteIds.has(routeId);

      try {
        const next = isFavorite
          ? await removeFavoriteRoute(routeId)
          : await addFavoriteRoute(routeId);
        setFavorites(next);
      } catch {
        // Keep the last known state on failure.
      } finally {
        setPendingRouteId(null);
      }
    },
    [favoriteRouteIds, pendingRouteId],
  );

  return { favorites, favoriteRouteIds, toggleFavorite, pendingRouteId };
}
