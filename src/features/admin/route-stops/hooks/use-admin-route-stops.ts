"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AdminAssignedRouteStop,
  AdminRouteLite,
  AdminRouteStopsSummary,
  AdminStopLite,
  RouteGeometryPoint,
} from "../api/admin.route-stops.api";
import {
  getAdminRouteStops,
  getAdminRoutesLite,
  getAdminStopsLite,
  updateAdminRouteStops,
} from "../api/admin.route-stops.api";

const EMPTY_SUMMARY: AdminRouteStopsSummary = {
  distanceKm: null,
  durationMinutes: null,
  source: "UNKNOWN",
};

function normalizeAssignedStops(items: AdminAssignedRouteStop[]) {
  return [...items]
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((item, index) => ({
      ...item,
      stopOrder: index + 1,
      distanceFromStartKm:
        item.distanceFromStartKm == null
          ? null
          : Number(item.distanceFromStartKm),
    }));
}

function clearCalculatedDistance(items: AdminAssignedRouteStop[]) {
  return items.map((item, index) => ({
    ...item,
    stopOrder: index + 1,
    distanceFromStartKm: null,
  }));
}

function serializeStops(items: AdminAssignedRouteStop[]) {
  return JSON.stringify(
    normalizeAssignedStops(items).map((item) => ({
      stopId: item.stopId,
      stopOrder: item.stopOrder,
    })),
  );
}

export function useAdminRouteStops() {
  const [routes, setRoutes] = useState<AdminRouteLite[]>([]);
  const [stops, setStops] = useState<AdminStopLite[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [assignedStops, setAssignedStops] = useState<AdminAssignedRouteStop[]>(
    [],
  );
  const [baselineStops, setBaselineStops] = useState<AdminAssignedRouteStop[]>(
    [],
  );
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometryPoint[]>([]);
  const [routeSummary, setRouteSummary] =
    useState<AdminRouteStopsSummary>(EMPTY_SUMMARY);
  const [loadingBoot, setLoadingBoot] = useState(true);
  const [loadingRouteStops, setLoadingRouteStops] = useState(false);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const unassignedStops = useMemo(() => {
    const assignedIds = new Set(assignedStops.map((item) => item.stopId));
    return stops.filter((item) => !assignedIds.has(item.id));
  }, [assignedStops, stops]);

  const hasUnsavedChanges = useMemo(() => {
    return serializeStops(assignedStops) !== serializeStops(baselineStops);
  }, [assignedStops, baselineStops]);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (assignedStops.length === 1) {
      issues.push("A route must have either 0 stops or at least 2 stops.");
    }

    const uniqueStopIds = new Set(assignedStops.map((item) => item.stopId));
    if (uniqueStopIds.size !== assignedStops.length) {
      issues.push("The same stop cannot be assigned twice in one route.");
    }

    return issues;
  }, [assignedStops]);

  const isRouteReadyToSave = validationIssues.length === 0;

  const changeSummary = useMemo(() => {
    const baselineByStopId = new Map(
      baselineStops.map((item) => [item.stopId, item]),
    );
    const currentByStopId = new Map(
      assignedStops.map((item) => [item.stopId, item]),
    );

    const added = assignedStops.filter(
      (item) => !baselineByStopId.has(item.stopId),
    ).length;
    const removed = baselineStops.filter(
      (item) => !currentByStopId.has(item.stopId),
    ).length;
    const reordered = assignedStops.filter((item) => {
      const baseline = baselineByStopId.get(item.stopId);
      return baseline && baseline.stopOrder !== item.stopOrder;
    }).length;

    return {
      added,
      removed,
      reordered,
    };
  }, [assignedStops, baselineStops]);

  const loadBoot = useCallback(async () => {
    setLoadingBoot(true);

    try {
      const [routesData, stopsData] = await Promise.all([
        getAdminRoutesLite(),
        getAdminStopsLite(),
      ]);

      setRoutes(routesData);
      setStops(stopsData);

      if (!selectedRouteId && routesData.length > 0) {
        setSelectedRouteId(routesData[0].id);
      }
    } finally {
      setLoadingBoot(false);
    }
  }, [selectedRouteId]);

  const loadRouteStops = useCallback(async (routeId: string) => {
    if (!routeId) {
      setAssignedStops([]);
      setBaselineStops([]);
      setRouteGeometry([]);
      setRouteSummary(EMPTY_SUMMARY);
      return;
    }

    setLoadingRouteStops(true);

    try {
      const response = await getAdminRouteStops(routeId);
      const normalized = normalizeAssignedStops(response.stops);

      setAssignedStops(normalized);
      setBaselineStops(normalized);
      setRouteGeometry(response.geometry ?? []);
      setRouteSummary(response.summary ?? EMPTY_SUMMARY);
    } finally {
      setLoadingRouteStops(false);
    }
  }, []);

  useEffect(() => {
    void loadBoot();
  }, [loadBoot]);

  useEffect(() => {
    if (!selectedRouteId) return;
    void loadRouteStops(selectedRouteId);
  }, [selectedRouteId, loadRouteStops]);

  function markRouteAsDirty() {
    setRouteGeometry([]);
    setRouteSummary(EMPTY_SUMMARY);
  }

  function addStop(stop: AdminStopLite) {
    const alreadyAssigned = assignedStops.some(
      (item) => item.stopId === stop.id,
    );

    if (alreadyAssigned) {
      return false;
    }

    setAssignedStops((prev) => [
      ...prev,
      {
        stopId: stop.id,
        stopName: stop.stopName,
        lat: stop.lat,
        lng: stop.lng,
        stopOrder: prev.length + 1,
        distanceFromStartKm: null,
      },
    ]);

    markRouteAsDirty();

    return true;
  }

  function removeStop(stopId: string) {
    setAssignedStops((prev) =>
      clearCalculatedDistance(prev.filter((item) => item.stopId !== stopId)),
    );
    markRouteAsDirty();
  }

  function reorderStop(stopId: string, targetIndex: number) {
    setAssignedStops((prev) => {
      const currentIndex = prev.findIndex((item) => item.stopId === stopId);
      if (currentIndex < 0) return prev;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      if (currentIndex === targetIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      if (!moved) return prev;
      next.splice(targetIndex, 0, moved);

      return clearCalculatedDistance(next);
    });

    markRouteAsDirty();
  }

  function moveStopUp(stopId: string) {
    setAssignedStops((prev) => {
      const index = prev.findIndex((item) => item.stopId === stopId);
      if (index <= 0) return prev;

      const next = [...prev];
      [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];

      return clearCalculatedDistance(next);
    });

    markRouteAsDirty();
  }

  function moveStopDown(stopId: string) {
    setAssignedStops((prev) => {
      const index = prev.findIndex((item) => item.stopId === stopId);
      if (index < 0 || index >= prev.length - 1) return prev;

      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];

      return clearCalculatedDistance(next);
    });

    markRouteAsDirty();
  }

  function discardChanges() {
    setAssignedStops(normalizeAssignedStops(baselineStops));
    void loadRouteStops(selectedRouteId);
  }

  async function save() {
    if (!selectedRouteId) {
      return {
        message: "No route selected.",
      };
    }

    const normalized = normalizeAssignedStops(assignedStops);
    const response = await updateAdminRouteStops(selectedRouteId, normalized);
    const savedStops = normalizeAssignedStops(response.stops);

    setAssignedStops(savedStops);
    setBaselineStops(savedStops);
    setRouteGeometry(response.geometry ?? []);
    setRouteSummary(response.summary ?? EMPTY_SUMMARY);

    return {
      message:
        response?.message ??
        "Route stops saved successfully and route distance was recalculated.",
    };
  }

  return {
    routes,
    stops,
    selectedRouteId,
    setSelectedRouteId,
    selectedRoute,
    assignedStops,
    unassignedStops,
    routeGeometry,
    routeSummary,
    loadingBoot,
    loadingRouteStops,
    hasUnsavedChanges,
    validationIssues,
    isRouteReadyToSave,
    changeSummary,
    reloadBoot: loadBoot,
    reloadRouteStops: loadRouteStops,
    addStop,
    removeStop,
    reorderStop,
    moveStopUp,
    moveStopDown,
    discardChanges,
    save,
  };
}
