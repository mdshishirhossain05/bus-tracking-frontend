import { api, unwrap } from "./client";
import { API_ENDPOINTS } from "./endpoints";
import type { UpdateProfileInput, UserProfile } from "../../types";

export async function getProfile(): Promise<UserProfile | null> {
  const res = await api.get(API_ENDPOINTS.auth.me);
  return unwrap<{ user: UserProfile }>(res.data)?.user ?? null;
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UserProfile | null> {
  const res = await api.patch(API_ENDPOINTS.auth.me, input);
  return unwrap<{ user: UserProfile }>(res.data)?.user ?? null;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<void> {
  await api.post(API_ENDPOINTS.auth.changePassword, input);
}
