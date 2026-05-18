import { api } from "@/lib/api/axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function getCurrentDriverTrip() {
  const res = await api.get(API_ENDPOINTS.driver.currentTrip);
  return res.data?.data ?? res.data;
}
