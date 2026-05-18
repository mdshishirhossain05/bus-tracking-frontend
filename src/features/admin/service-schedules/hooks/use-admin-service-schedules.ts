"use client";

import { useCallback, useEffect, useState } from "react";
import {
  archiveServiceSchedule,
  createServiceSchedule,
  getServiceSchedules,
  permanentlyDeleteServiceSchedule,
  restoreServiceSchedule,
  updateServiceSchedule,
  type DayType,
  type ServiceScheduleItem,
} from "../api/admin.service-schedules.api";

interface ServiceScheduleQueryState {
  page: number;
  limit: number;
  search: string;
  dayType: DayType | "ALL";
  isActive: "ALL" | "true" | "false";
}

const DEFAULT_QUERY: ServiceScheduleQueryState = {
  page: 1,
  limit: 20,
  search: "",
  dayType: "ALL",
  isActive: "ALL",
};

const DEFAULT_META = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

function upsertSchedule(
  items: ServiceScheduleItem[],
  nextItem: ServiceScheduleItem,
) {
  const withoutExisting = items.filter((item) => item.id !== nextItem.id);
  return [nextItem, ...withoutExisting];
}

export function useAdminServiceSchedules() {
  const [items, setItems] = useState<ServiceScheduleItem[]>([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<ServiceScheduleQueryState>(DEFAULT_QUERY);

  const fetchSchedules = useCallback(
    async (
      currentQuery: ServiceScheduleQueryState,
      options?: { keepLoading?: boolean },
    ) => {
      if (!options?.keepLoading) {
        setLoading(true);
      }

      try {
        const res = await getServiceSchedules({
          page: currentQuery.page,
          limit: currentQuery.limit,
          search: currentQuery.search.trim() || undefined,
          dayType:
            currentQuery.dayType === "ALL" ? undefined : currentQuery.dayType,
          isActive:
            currentQuery.isActive === "ALL"
              ? undefined
              : currentQuery.isActive === "true",
        });

        setItems(Array.isArray(res.items) ? res.items : []);
        setMeta({
          page: Number(res.meta?.page ?? currentQuery.page),
          limit: Number(res.meta?.limit ?? currentQuery.limit),
          total: Number(res.meta?.total ?? 0),
          totalPages: Number(res.meta?.totalPages ?? 1),
        });
      } finally {
        if (!options?.keepLoading) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void fetchSchedules(query);
  }, [fetchSchedules, query]);

  const reload = useCallback(
    () => fetchSchedules(query),
    [fetchSchedules, query],
  );

  const create = useCallback(
    async (payload: {
      routeId: string;
      busId: string;
      driverId: string;
      dayType: DayType;
      departureTime: string;
      isActive?: boolean;
      notes?: string | null;
    }) => {
      const created = await createServiceSchedule(payload);

      const nextQuery: ServiceScheduleQueryState = {
        ...DEFAULT_QUERY,
        limit: query.limit,
      };

      setQuery(nextQuery);
      setItems((current) => upsertSchedule(current, created));
      setMeta((current) => {
        const nextTotal = current.total + 1;

        return {
          page: 1,
          limit: current.limit,
          total: nextTotal,
          totalPages: Math.max(1, Math.ceil(nextTotal / current.limit)),
        };
      });

      void fetchSchedules(nextQuery, { keepLoading: true });

      return created;
    },
    [fetchSchedules, query.limit],
  );

  const update = useCallback(
    async (
      id: string,
      payload: Partial<{
        routeId: string;
        busId: string;
        driverId: string;
        dayType: DayType;
        departureTime: string;
        isActive: boolean;
        notes: string | null;
      }>,
    ) => {
      const updated = await updateServiceSchedule(id, payload);
      const nextQuery: ServiceScheduleQueryState = {
        ...query,
        page: 1,
      };

      setItems((current) => upsertSchedule(current, updated));
      setQuery(nextQuery);
      void fetchSchedules(nextQuery, { keepLoading: true });

      return updated;
    },
    [fetchSchedules, query],
  );

  const archive = useCallback(
    async (id: string) => {
      const result = await archiveServiceSchedule(id);
      const nextQuery: ServiceScheduleQueryState = {
        ...query,
        page: 1,
      };

      if (result.item) {
        setItems((current) => upsertSchedule(current, result.item!));
      }

      setQuery(nextQuery);
      void fetchSchedules(nextQuery, { keepLoading: true });

      return result;
    },
    [fetchSchedules, query],
  );

  const restore = useCallback(
    async (id: string) => {
      const result = await restoreServiceSchedule(id);
      const nextQuery: ServiceScheduleQueryState = {
        ...query,
        page: 1,
      };

      if (result.item) {
        setItems((current) => upsertSchedule(current, result.item!));
      }

      setQuery(nextQuery);
      void fetchSchedules(nextQuery, { keepLoading: true });

      return result;
    },
    [fetchSchedules, query],
  );

  const permanentDelete = useCallback(
    async (id: string) => {
      const result = await permanentlyDeleteServiceSchedule(id);
      const nextQuery: ServiceScheduleQueryState = {
        ...query,
        page: 1,
      };

      if (result.permanentlyDeleted) {
        setItems((current) => current.filter((item) => item.id !== id));
        setMeta((current) => {
          const nextTotal = Math.max(0, current.total - 1);

          return {
            ...current,
            page: 1,
            total: nextTotal,
            totalPages: Math.max(1, Math.ceil(nextTotal / current.limit)),
          };
        });
      }

      setQuery(nextQuery);
      void fetchSchedules(nextQuery, { keepLoading: true });

      return result;
    },
    [fetchSchedules, query],
  );

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

  function setSearch(search: string) {
    setQuery((prev) => ({
      ...prev,
      search,
      page: 1,
    }));
  }

  function setDayType(dayType: DayType | "ALL") {
    setQuery((prev) => ({
      ...prev,
      dayType,
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

  function resetFilters() {
    setQuery((prev) => ({
      ...DEFAULT_QUERY,
      limit: prev.limit,
    }));
  }

  return {
    items,
    meta,
    query,
    loading,
    reload,
    setPage,
    setLimit,
    setSearch,
    setDayType,
    setIsActive,
    resetFilters,
    create,
    update,
    archive,
    restore,
    permanentDelete,
  };
}
