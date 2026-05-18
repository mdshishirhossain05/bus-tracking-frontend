"use client";

import { useEffect, useRef, useState } from "react";
import { getRoutePresentationById } from "@/features/routes/api/route-presentation.api";
import { normalizeRoutePresentation } from "@/features/routes/api/route-presentation.normalizer";
import type { RoutePresentation } from "@/features/routes/types";

interface UseRoutePresentationState {
  data: RoutePresentation | null;
  loading: boolean;
  error: string | null;
}

export function useRoutePresentation(routeId?: string | null) {
  const lastGoodDataRef = useRef<RoutePresentation | null>(null);

  const [state, setState] = useState<UseRoutePresentationState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!routeId) {
      lastGoodDataRef.current = null;
      setState({
        data: null,
        loading: false,
        error: null,
      });
      return;
    }

    const activeRouteId = routeId;
    let active = true;

    async function run() {
      setState((prev) => ({
        data: prev.data,
        loading: true,
        error: null,
      }));

      try {
        const response = await getRoutePresentationById(activeRouteId);
        const normalized = normalizeRoutePresentation(response);

        if (!active) return;

        if (normalized) {
          lastGoodDataRef.current = normalized;
          setState({
            data: normalized,
            loading: false,
            error: null,
          });
          return;
        }

        setState({
          data: lastGoodDataRef.current,
          loading: false,
          error: "Route presentation is unavailable.",
        });
      } catch {
        if (!active) return;

        setState({
          data: lastGoodDataRef.current,
          loading: false,
          error: "Route presentation could not be loaded.",
        });
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [routeId]);

  return state;
}
