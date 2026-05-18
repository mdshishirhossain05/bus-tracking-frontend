import { api } from "@/lib/api/axios";

export interface FavoriteRoute {
  id: string;
  routeId: string;
  routeName: string;
  description: string | null;
  isActive: boolean;
  favoritedAt: string;
}

function unwrapItems(data: unknown): FavoriteRoute[] {
  const root = (data ?? {}) as Record<string, unknown>;
  const nested = (root.data ?? {}) as Record<string, unknown>;
  const items = nested.items ?? root.items;
  return Array.isArray(items) ? (items as FavoriteRoute[]) : [];
}

export async function getFavoriteRoutes(): Promise<FavoriteRoute[]> {
  const res = await api.get("/passenger/favorites");
  return unwrapItems(res.data);
}

export async function addFavoriteRoute(
  routeId: string,
): Promise<FavoriteRoute[]> {
  const res = await api.post("/passenger/favorites", { routeId });
  return unwrapItems(res.data);
}

export async function removeFavoriteRoute(
  routeId: string,
): Promise<FavoriteRoute[]> {
  const res = await api.delete(`/passenger/favorites/${routeId}`);
  return unwrapItems(res.data);
}
