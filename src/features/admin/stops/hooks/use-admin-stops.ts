"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStops,
  createStop as createStopRequest,
  updateStop as updateStopRequest,
  deleteStop as deleteStopRequest,
  type StopItem,
} from "../api/admin.stops.api";

interface StopQueryState {
  page: number;
  limit: number;
  search: string;
  isActive: "ALL" | "true" | "false";
}

function sortStops(stops: StopItem[]) {
  return [...stops].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return a.stopName.localeCompare(b.stopName, undefined, {
      sensitivity: "base",
    });
  });
}

function upsertStop(stops: StopItem[], nextStop: StopItem) {
  const withoutExisting = stops.filter((stop) => stop.id !== nextStop.id);
  return sortStops([...withoutExisting, nextStop]);
}

const DEFAULT_QUERY: StopQueryState = {
  page: 1,
  limit: 20,
  search: "",
  isActive: "ALL",
};

export function useAdminStops() {
  const [allStops, setAllStops] = useState<StopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<StopQueryState>(DEFAULT_QUERY);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getStops();
      setAllStops(sortStops(Array.isArray(data) ? data : []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredStops = useMemo(() => {
    const q = query.search.trim().toLowerCase();

    return allStops.filter((stop) => {
      const matchesSearch =
        !q ||
        stop.stopName.toLowerCase().includes(q) ||
        (stop.stopCode ?? "").toLowerCase().includes(q) ||
        (stop.landmark ?? "").toLowerCase().includes(q) ||
        (stop.address ?? "").toLowerCase().includes(q) ||
        (stop.notes ?? "").toLowerCase().includes(q) ||
        String(stop.lat).includes(q) ||
        String(stop.lng).includes(q);

      const matchesStatus =
        query.isActive === "ALL" ||
        (query.isActive === "true" ? stop.isActive : !stop.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [allStops, query]);

  const pagedStops = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredStops.length / query.limit),
    );
    const safePage = Math.min(query.page, totalPages);
    const start = (safePage - 1) * query.limit;
    const end = start + query.limit;

    return filteredStops.slice(start, end);
  }, [filteredStops, query.limit, query.page]);

  const meta = useMemo(() => {
    const total = filteredStops.length;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      page: Math.min(query.page, totalPages),
      limit: query.limit,
      total,
      totalPages,
    };
  }, [filteredStops.length, query.limit, query.page]);

  const createStop = useCallback(
    async (payload: {
      stopName: string;
      stopCode?: string | null;
      landmark?: string | null;
      address?: string | null;
      notes?: string | null;
      isActive?: boolean;
      lat: number;
      lng: number;
    }) => {
      const created = await createStopRequest(payload);

      setAllStops((current) => upsertStop(current, created));

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

  const updateStop = useCallback(
    async (
      id: string,
      payload: Partial<{
        stopName: string;
        stopCode: string | null;
        landmark: string | null;
        address: string | null;
        notes: string | null;
        isActive: boolean;
        lat: number;
        lng: number;
      }>,
    ) => {
      const updated = await updateStopRequest(id, payload);

      setAllStops((current) => upsertStop(current, updated));

      setQuery((current) => ({
        ...current,
        page: 1,
      }));

      return updated;
    },
    [],
  );

  const deleteStop = useCallback(async (id: string) => {
    const result = await deleteStopRequest(id);

    setAllStops((current) => current.filter((stop) => stop.id !== id));

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
    stops: pagedStops,
    allStops,
    filteredCount: filteredStops.length,
    loading,
    meta,
    query,
    reload: load,
    setSearch,
    setIsActive,
    setPage,
    setLimit,
    resetFilters,
    createStop,
    updateStop,
    deleteStop,
  };
}
