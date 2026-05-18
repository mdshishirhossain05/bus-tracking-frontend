import { api } from "@/lib/api/axios";

export interface AdminRouteItem {
  id: string;
  routeName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

function normalizeRoute(item: any): AdminRouteItem {
  return {
    id: item.id,
    routeName: item.routeName,
    description: item.description ?? null,
    isActive: Boolean(item.isActive),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function getAdminRoutes(): Promise<AdminRouteItem[]> {
  const res = await api.get("/admin/routes");
  const raw = res.data?.routes ?? res.data?.data ?? [];

  return Array.isArray(raw) ? raw.map(normalizeRoute) : [];
}

export async function createAdminRoute(payload: {
  routeName: string;
  description?: string | null;
  isActive?: boolean;
}): Promise<AdminRouteItem> {
  const res = await api.post("/admin/routes", payload);
  return normalizeRoute(res.data?.route ?? res.data?.data);
}

export async function updateAdminRoute(
  id: string,
  payload: Partial<{
    routeName: string;
    description: string | null;
    isActive: boolean;
  }>,
): Promise<AdminRouteItem> {
  const res = await api.patch(`/admin/routes/${id}`, payload);
  return normalizeRoute(res.data?.route ?? res.data?.data);
}

export async function deleteAdminRoute(id: string) {
  const res = await api.delete(`/admin/routes/${id}`);
  return res.data;
}
