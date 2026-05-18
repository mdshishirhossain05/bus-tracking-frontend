"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRouteItem } from "../api/admin.routes.api";
import {
  createAdminRoute,
  deleteAdminRoute,
  getAdminRoutes,
  updateAdminRoute,
} from "../api/admin.routes.api";

interface RouteQueryState {
  page: number;
  limit: number;
  search: string;
  isActive: "ALL" | "true" | "false";
}

const DEFAULT_QUERY: RouteQueryState = {
  page: 1,
  limit: 20,
  search: "",
  isActive: "ALL",
};

function sortRoutes(routes: AdminRouteItem[]) {
  return [...routes].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return a.routeName.localeCompare(b.routeName, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function upsertRoute(routes: AdminRouteItem[], nextRoute: AdminRouteItem) {
  const withoutExisting = routes.filter((route) => route.id !== nextRoute.id);
  return sortRoutes([...withoutExisting, nextRoute]);
}

export function useAdminRoutes() {
  const [allRoutes, setAllRoutes] = useState<AdminRouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<RouteQueryState>(DEFAULT_QUERY);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getAdminRoutes();
      setAllRoutes(sortRoutes(Array.isArray(data) ? data : []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRoutes = useMemo(() => {
    const q = query.search.trim().toLowerCase();

    return allRoutes.filter((route) => {
      const matchesSearch =
        !q ||
        route.routeName.toLowerCase().includes(q) ||
        (route.description ?? "").toLowerCase().includes(q);

      const matchesStatus =
        query.isActive === "ALL"
          ? true
          : query.isActive === "true"
            ? route.isActive
            : !route.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [allRoutes, query]);

  const pagedRoutes = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredRoutes.length / query.limit),
    );
    const safePage = Math.min(query.page, totalPages);
    const start = (safePage - 1) * query.limit;
    const end = start + query.limit;

    return filteredRoutes.slice(start, end);
  }, [filteredRoutes, query.limit, query.page]);

  const meta = useMemo(() => {
    const total = filteredRoutes.length;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      page: Math.min(query.page, totalPages),
      limit: query.limit,
      total,
      totalPages,
    };
  }, [filteredRoutes.length, query.limit, query.page]);

  const activeCount = useMemo(
    () => allRoutes.filter((item) => item.isActive).length,
    [allRoutes],
  );

  const createRoute = useCallback(
    async (payload: {
      routeName: string;
      description?: string | null;
      isActive?: boolean;
    }) => {
      const created = await createAdminRoute(payload);

      setAllRoutes((current) => upsertRoute(current, created));
      setQuery((current) => ({
        ...current,
        page: 1,
        search: "",
        isActive: "ALL",
      }));

      return created;
    },
    [],
  );

  const updateRoute = useCallback(
    async (
      id: string,
      payload: Partial<{
        routeName: string;
        description: string | null;
        isActive: boolean;
      }>,
    ) => {
      const updated = await updateAdminRoute(id, payload);

      setAllRoutes((current) => upsertRoute(current, updated));
      setQuery((current) => ({
        ...current,
        page: 1,
      }));

      return updated;
    },
    [],
  );

  const deleteRoute = useCallback(async (id: string) => {
    const result = await deleteAdminRoute(id);

    setAllRoutes((current) => current.filter((route) => route.id !== id));
    setQuery((current) => ({
      ...current,
      page: 1,
    }));

    return result;
  }, []);

  function setSearch(search: string) {
    setQuery((prev) => ({
      ...prev,
      search,
      page: 1,
    }));
  }

  function setIsActive(isActive: "ALL" | "true" | "false") {
    setQuery((prev) => ({
      ...prev,
      isActive,
      page: 1,
    }));
  }

  function setPage(page: number) {
    setQuery((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }

  function setLimit(limit: number) {
    setQuery((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  }

  function resetFilters() {
    setQuery(DEFAULT_QUERY);
  }

  return {
    routes: pagedRoutes,
    allRoutes,
    filteredCount: filteredRoutes.length,
    loading,
    meta,
    query,
    reload: load,
    setSearch,
    setIsActive,
    setPage,
    setLimit,
    resetFilters,
    activeCount,
    createRoute,
    updateRoute,
    deleteRoute,
  };
}
