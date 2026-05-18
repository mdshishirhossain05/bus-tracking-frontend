"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignGpsDeviceToBus,
  createAdminGpsDevice,
  deleteAdminGpsDevice,
  getAdminBusOptions,
  getAdminGpsDevices,
  reconcileAdminGpsDeviceWithTraccar,
  unassignGpsDeviceFromBus,
  updateAdminGpsDevice,
} from "../api/admin-gps-devices.api";
import type { AdminBusOption, AdminGpsDeviceItem } from "../types";

interface GpsDeviceQueryState {
  page: number;
  limit: number;
  search: string;
  isActive: "ALL" | "true" | "false";
  assignment: "ALL" | "assigned" | "unassigned";
}

export function useAdminGpsDevices() {
  const [allGpsDevices, setAllGpsDevices] = useState<AdminGpsDeviceItem[]>([]);
  const [busOptions, setBusOptions] = useState<AdminBusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState<GpsDeviceQueryState>({
    page: 1,
    limit: 20,
    search: "",
    isActive: "ALL",
    assignment: "ALL",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gpsDevicesResult, busOptionsResult] = await Promise.allSettled([
        getAdminGpsDevices(),
        getAdminBusOptions(),
      ]);

      if (gpsDevicesResult.status === "fulfilled") {
        setAllGpsDevices(
          Array.isArray(gpsDevicesResult.value) ? gpsDevicesResult.value : [],
        );
      } else {
        throw gpsDevicesResult.reason;
      }

      if (busOptionsResult.status === "fulfilled") {
        setBusOptions(
          Array.isArray(busOptionsResult.value) ? busOptionsResult.value : [],
        );
      } else {
        setBusOptions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredGpsDevices = useMemo(() => {
    const q = query.search.trim().toLowerCase();

    return allGpsDevices.filter((device) => {
      const matchesSearch =
        !q ||
        device.deviceCode.toLowerCase().includes(q) ||
        (device.displayName ?? "").toLowerCase().includes(q) ||
        (device.serialNumber ?? "").toLowerCase().includes(q) ||
        (device.vendorName ?? "").toLowerCase().includes(q) ||
        (device.modelName ?? "").toLowerCase().includes(q) ||
        (device.imei ?? "").toLowerCase().includes(q) ||
        (device.traccarUniqueId ?? "").toLowerCase().includes(q) ||
        (device.activeAssignment?.bus?.busCode ?? "").toLowerCase().includes(q);

      const matchesStatus =
        query.isActive === "ALL"
          ? true
          : query.isActive === "true"
            ? device.isActive
            : !device.isActive;

      const matchesAssignment =
        query.assignment === "ALL"
          ? true
          : query.assignment === "assigned"
            ? Boolean(device.activeAssignment)
            : !device.activeAssignment;

      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [allGpsDevices, query]);

  const pagedGpsDevices = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredGpsDevices.length / query.limit),
    );
    const safePage = Math.min(query.page, totalPages);
    const start = (safePage - 1) * query.limit;
    const end = start + query.limit;
    return filteredGpsDevices.slice(start, end);
  }, [filteredGpsDevices, query.page, query.limit]);

  const meta = useMemo(() => {
    const total = filteredGpsDevices.length;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      page: Math.min(query.page, totalPages),
      limit: query.limit,
      total,
      totalPages,
    };
  }, [filteredGpsDevices.length, query.limit, query.page]);

  const activeCount = useMemo(
    () => allGpsDevices.filter((item) => item.isActive).length,
    [allGpsDevices],
  );

  const assignedCount = useMemo(
    () => allGpsDevices.filter((item) => Boolean(item.activeAssignment)).length,
    [allGpsDevices],
  );

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

  function setAssignment(assignment: "ALL" | "assigned" | "unassigned") {
    setQuery((prev) => ({
      ...prev,
      assignment,
      page: 1,
    }));
  }

  function setPage(page: number) {
    setQuery((prev) => ({
      ...prev,
      page,
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
    setQuery({
      page: 1,
      limit: 20,
      search: "",
      isActive: "ALL",
      assignment: "ALL",
    });
  }

  function removeGpsDeviceLocally(id: string) {
    setAllGpsDevices((prev) => prev.filter((item) => item.id !== id));

    setQuery((prev) => {
      const nextTotal = Math.max(0, filteredGpsDevices.length - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / prev.limit));

      return {
        ...prev,
        page: Math.min(prev.page, nextTotalPages),
      };
    });
  }

  function upsertGpsDeviceLocally(device: AdminGpsDeviceItem) {
    setAllGpsDevices((prev) => {
      const index = prev.findIndex((item) => item.id === device.id);
      if (index === -1) return [device, ...prev];

      const copy = [...prev];
      copy[index] = device;
      return copy;
    });
  }

  return {
    gpsDevices: pagedGpsDevices,
    allGpsDevices,
    busOptions,
    filteredCount: filteredGpsDevices.length,
    loading,
    meta,
    query,
    reload: load,
    setSearch,
    setIsActive,
    setAssignment,
    setPage,
    setLimit,
    resetFilters,
    activeCount,
    assignedCount,
    createGpsDevice: createAdminGpsDevice,
    updateGpsDevice: updateAdminGpsDevice,
    deleteGpsDevice: deleteAdminGpsDevice,
    assignGpsDeviceToBus,
    unassignGpsDeviceFromBus,
    reconcileTraccarGpsDevice: reconcileAdminGpsDeviceWithTraccar,
    removeGpsDeviceLocally,
    upsertGpsDeviceLocally,
  };
}
