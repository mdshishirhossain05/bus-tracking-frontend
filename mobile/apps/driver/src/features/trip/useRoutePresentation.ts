import { useEffect, useState } from "react";
import type { RoutePresentation } from "@ubts/shared";
import { getRoutePresentation } from "../../api/routes.api";

/** Fetches the route geometry + ordered stops once per route id. */
export function useRoutePresentation(
  routeId: string | null | undefined,
): RoutePresentation | null {
  const [presentation, setPresentation] = useState<RoutePresentation | null>(
    null,
  );

  useEffect(() => {
    if (!routeId) {
      setPresentation(null);
      return;
    }
    let active = true;
    void getRoutePresentation(routeId)
      .then((p) => {
        if (active) setPresentation(p);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [routeId]);

  return presentation;
}
