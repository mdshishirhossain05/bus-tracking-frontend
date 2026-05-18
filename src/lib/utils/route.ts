import { ROUTE_PRESENTATIONS } from "@/lib/constants/route-presentations";
import type { RoutePresentation } from "@/features/routes/types";

export function getFallbackRoutePresentation(
  routeId?: string | null,
): RoutePresentation | null {
  if (!routeId) return null;

  return ROUTE_PRESENTATIONS.find((route) => route.routeId === routeId) ?? null;
}
