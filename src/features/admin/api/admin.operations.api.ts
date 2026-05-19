import { api } from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function getAdminOperationsOverview() {
  const res = await api.get(API_ENDPOINTS.admin.operationsOverview);
  return res.data?.data ?? res.data;
}

export async function getAdminOperationsEvents(limit = 30) {
  const res = await api.get(API_ENDPOINTS.admin.operationsEvents, {
    params: { limit },
  });

  return res.data?.data ?? res.data;
}

export async function getAdminActiveTrips() {
  const res = await api.get(API_ENDPOINTS.admin.operationsActiveTrips);
  return res.data?.data ?? res.data;
}

export async function getAdminTripSourceDiagnostics(tripId: string) {
  const res = await api.get(API_ENDPOINTS.admin.tripSourceDiagnostics(tripId));
  return res.data?.data ?? res.data;
}

export async function getAdminTripOperationsDetail(tripId: string) {
  const res = await api.get(API_ENDPOINTS.admin.tripOperationsDetail(tripId));
  return res.data?.data ?? res.data;
}

export async function forceEndAdminTrip(tripId: string) {
  const res = await api.post(API_ENDPOINTS.admin.forceEndTrip(tripId));
  return res.data?.data ?? res.data;
}

export async function forceRecoverAdminTrip(tripId: string) {
  const res = await api.post(API_ENDPOINTS.admin.forceRecoverTrip(tripId));
  return res.data?.data ?? res.data;
}

export async function startAdminTrip(serviceScheduleId: string) {
  const res = await api.post("/admin/operations/trips/start", {
    serviceScheduleId,
  });
  return res.data?.data ?? res.data;
}

export async function setAdminTripAutoEnd(tripId: string, disabled: boolean) {
  const res = await api.post(
    `/admin/operations/trips/${tripId}/auto-end`,
    { disabled },
  );
  return res.data?.data ?? res.data;
}
