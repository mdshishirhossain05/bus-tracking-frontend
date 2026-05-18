"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { AdminRouteLite } from "../api/admin.route-stops.api";

interface RouteSelectorCardProps {
  routes: AdminRouteLite[];
  selectedRouteId: string;
  onChange: (routeId: string) => void;
}

export function RouteSelectorCard({
  routes,
  selectedRouteId,
  onChange,
}: RouteSelectorCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">
            Select route
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose the route whose stop sequence you want to manage.
          </p>
        </div>

        <Select
          value={selectedRouteId}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select a route</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.routeName}
            </option>
          ))}
        </Select>
      </CardContent>
    </Card>
  );
}