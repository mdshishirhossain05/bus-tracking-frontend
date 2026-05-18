"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminBusAssignmentResponse,
  AdminBusItem,
} from "../api/admin.buses.api";
import {
  assignGpsDeviceToBus as assignGpsDeviceToBusRequest,
  createAdminBus,
  deleteAdminBus,
  getAdminBuses,
  unassignGpsDeviceFromBus as unassignGpsDeviceFromBusRequest,
  updateAdminBus,
} from "../api/admin.buses.api";
import { getAdminGpsDevices } from "../../gps-devices/api/admin-gps-devices.api";
import type { AdminGpsDeviceItem } from "../../gps-devices/types";

interface BusQueryState {
  page: number;
  limit: number;
  search: string;
  isActive: "ALL" | "true" | "false";
}

const DEFAULT_QUERY: BusQueryState = {
  page: 1,
  limit: 20,
  search: "",
  isActive: "ALL",
};

function sortBuses(items: AdminBusItem[]) {
  return [...items].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    return a.busCode.localeCompare(b.busCode, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

function upsertBus(items: AdminBusItem[], nextBus: AdminBusItem) {
  const withoutExisting = items.filter((item) => item.id !== nextBus.id);
  return sortBuses([...withoutExisting, nextBus]);
}

function applyAssignmentToBuses(
  items: AdminBusItem[],
  busId: string,
  response: AdminBusAssignmentResponse,
) {
  return sortBuses(
    items.map((bus) =>
      bus.id === busId
        ? {
            ...bus,
            busCode: response.bus.busCode ?? bus.busCode,
            plateNumber: response.bus.plateNumber ?? bus.plateNumber,
            isActive: response.bus.isActive,
            activeGpsDeviceAssignment: response.assignment,
          }
        : bus,
    ),
  );
}

function applyAssignmentToGpsDevices(
  items: AdminGpsDeviceItem[],
  busId: string,
  response: AdminBusAssignmentResponse,
) {
  return items.map((device) => {
    if (response.assignment?.gpsDevice.id === device.id) {
      return {
        ...device,
        activeAssignment: {
          id: response.assignment.id,
          assignedAt: response.assignment.assignedAt,
          notes: response.assignment.notes,
          unassignedAt: null,
          bus: {
            id: response.bus.id,
            busCode: response.bus.busCode,
            plateNumber: response.bus.plateNumber,
            isActive: response.bus.isActive,
          },
          gpsDevice: null,
        },
      };
    }

    if (device.activeAssignment?.bus?.id === busId) {
      return {
        ...device,
        activeAssignment: null,
      };
    }

    return device;
  });
}

export function useAdminBuses() {
  const [allBuses, setAllBuses] = useState<AdminBusItem[]>([]);
  const [gpsDevices, setGpsDevices] = useState<AdminGpsDeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<BusQueryState>(DEFAULT_QUERY);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [busesData, gpsDevicesData] = await Promise.all([
        getAdminBuses(),
        getAdminGpsDevices(),
      ]);

      setAllBuses(sortBuses(Array.isArray(busesData) ? busesData : []));
      setGpsDevices(Array.isArray(gpsDevicesData) ? gpsDevicesData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredBuses = useMemo(() => {
    const q = query.search.trim().toLowerCase();

    return allBuses.filter((bus) => {
      const gpsDeviceCode =
        bus.activeGpsDeviceAssignment?.gpsDevice.deviceCode?.toLowerCase() ??
        "";
      const gpsDisplayName =
        bus.activeGpsDeviceAssignment?.gpsDevice.displayName?.toLowerCase() ??
        "";
      const gpsUniqueId =
        bus.activeGpsDeviceAssignment?.gpsDevice.traccarUniqueId?.toLowerCase() ??
        "";

      const matchesSearch =
        !q ||
        bus.busCode.toLowerCase().includes(q) ||
        (bus.plateNumber ?? "").toLowerCase().includes(q) ||
        String(bus.capacity ?? "").includes(q) ||
        gpsDeviceCode.includes(q) ||
        gpsDisplayName.includes(q) ||
        gpsUniqueId.includes(q);

      const matchesStatus =
        query.isActive === "ALL"
          ? true
          : query.isActive === "true"
            ? bus.isActive
            : !bus.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [allBuses, query]);

  const pagedBuses = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredBuses.length / query.limit),
    );
    const safePage = Math.min(query.page, totalPages);
    const start = (safePage - 1) * query.limit;
    const end = start + query.limit;

    return filteredBuses.slice(start, end);
  }, [filteredBuses, query.limit, query.page]);

  const meta = useMemo(() => {
    const total = filteredBuses.length;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      page: Math.min(query.page, totalPages),
      limit: query.limit,
      total,
      totalPages,
    };
  }, [filteredBuses.length, query.limit, query.page]);

  const activeCount = useMemo(
    () => allBuses.filter((item) => item.isActive).length,
    [allBuses],
  );

  const assignedGpsCount = useMemo(
    () =>
      allBuses.filter((item) => Boolean(item.activeGpsDeviceAssignment)).length,
    [allBuses],
  );

  const assignableGpsDevices = useMemo(
    () =>
      gpsDevices.filter(
        (device) => device.isActive && !device.activeAssignment,
      ),
    [gpsDevices],
  );

  const createBus = useCallback(
    async (payload: {
      busCode: string;
      plateNumber?: string | null;
      capacity?: number | null;
      isActive?: boolean;
    }) => {
      const created = await createAdminBus(payload);

      setAllBuses((current) => upsertBus(current, created));
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

  const updateBus = useCallback(
    async (
      id: string,
      payload: Partial<{
        busCode: string;
        plateNumber: string | null;
        capacity: number | null;
        isActive: boolean;
      }>,
    ) => {
      const updated = await updateAdminBus(id, payload);

      setAllBuses((current) => upsertBus(current, updated));
      setQuery((current) => ({
        ...current,
        page: 1,
      }));

      return updated;
    },
    [],
  );

  const deleteBus = useCallback(async (id: string) => {
    const result = await deleteAdminBus(id);

    setAllBuses((current) => current.filter((item) => item.id !== id));
    setQuery((current) => ({
      ...current,
      page: 1,
    }));

    return result;
  }, []);

  const assignGpsDeviceToBus = useCallback(
    async (payload: {
      busId: string;
      gpsDeviceId: string;
      notes?: string | null;
    }) => {
      const response = await assignGpsDeviceToBusRequest(payload);

      setAllBuses((current) =>
        applyAssignmentToBuses(current, payload.busId, response),
      );
      setGpsDevices((current) =>
        applyAssignmentToGpsDevices(current, payload.busId, response),
      );
      setQuery((current) => ({
        ...current,
        page: 1,
      }));

      return response;
    },
    [],
  );

  const unassignGpsDeviceFromBus = useCallback(async (busId: string) => {
    const response = await unassignGpsDeviceFromBusRequest(busId);

    setAllBuses((current) => applyAssignmentToBuses(current, busId, response));
    setGpsDevices((current) =>
      applyAssignmentToGpsDevices(current, busId, response),
    );
    setQuery((current) => ({
      ...current,
      page: 1,
    }));

    return response;
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
    buses: pagedBuses,
    allBuses,
    gpsDevices,
    assignableGpsDevices,
    filteredCount: filteredBuses.length,
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
    assignedGpsCount,
    createBus,
    updateBus,
    deleteBus,
    assignGpsDeviceToBus,
    unassignGpsDeviceFromBus,
  };
}
