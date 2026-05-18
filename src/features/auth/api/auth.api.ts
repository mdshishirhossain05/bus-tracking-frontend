import { api } from "@/lib/api/axios";
import type { AuthSessionItem, AuthUser } from "@/types/auth";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type AuthUserEnvelope = ApiEnvelope<{
  user: AuthUser | null;
}>;

type SessionsEnvelope = ApiEnvelope<{
  sessions: AuthSessionItem[];
}>;

type RegistrationSettings = {
  passengerSelfRegistrationEnabled: boolean;
  updatedAt?: string;
};

type RegistrationSettingsEnvelope = ApiEnvelope<RegistrationSettings>;

type RequestPassengerRegistrationOtpEnvelope = ApiEnvelope<{
  email: string;
  expiresAt: string;
  resendAfterSeconds: number;
}>;

type VerifyPassengerRegistrationOtpEnvelope = ApiEnvelope<{
  email: string;
  emailVerificationToken: string;
}>;

export async function getPublicRegistrationSettings(): Promise<RegistrationSettings> {
  const res = await api.get<RegistrationSettingsEnvelope>(
    "/auth/registration-settings",
  );

  return res.data?.data ?? { passengerSelfRegistrationEnabled: true };
}

export async function requestPassengerRegistrationOtp(payload: {
  email: string;
}): Promise<{
  email: string;
  expiresAt: string;
  resendAfterSeconds: number;
}> {
  const res = await api.post<RequestPassengerRegistrationOtpEnvelope>(
    "/auth/register/request-otp",
    payload,
  );

  return (
    res.data?.data ?? {
      email: payload.email,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      resendAfterSeconds: 60,
    }
  );
}

export async function verifyPassengerRegistrationOtp(payload: {
  email: string;
  otp: string;
}): Promise<{
  email: string;
  emailVerificationToken: string;
}> {
  const res = await api.post<VerifyPassengerRegistrationOtpEnvelope>(
    "/auth/register/verify-otp",
    payload,
  );

  if (!res.data?.data?.emailVerificationToken) {
    throw new Error("Email verification failed.");
  }

  return res.data.data;
}

export async function registerPassenger(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  phoneNumber?: string;
  academicDepartment?: string;
  academicBatch?: string;
  transportPickupPoint?: string;
  emailVerificationToken: string;
}): Promise<AuthUser | null> {
  const res = await api.post<AuthUserEnvelope>("/auth/register", payload);
  return res.data?.data?.user ?? null;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthUser | null> {
  const res = await api.post<AuthUserEnvelope>("/auth/login", payload);
  return res.data?.data?.user ?? null;
}

type ForgotPasswordRequestEnvelope = ApiEnvelope<{
  email: string;
  resendAfterSeconds: number;
}>;

type ForgotPasswordVerifyEnvelope = ApiEnvelope<{
  email: string;
  verificationToken: string;
}>;

export async function requestPasswordReset(payload: {
  email: string;
}): Promise<{ email: string; resendAfterSeconds: number }> {
  const res = await api.post<ForgotPasswordRequestEnvelope>(
    "/auth/forgot-password/request",
    payload,
  );

  return (
    res.data?.data ?? {
      email: payload.email,
      resendAfterSeconds: 60,
    }
  );
}

export async function verifyPasswordResetOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ email: string; verificationToken: string }> {
  const res = await api.post<ForgotPasswordVerifyEnvelope>(
    "/auth/forgot-password/verify",
    payload,
  );

  if (!res.data?.data?.verificationToken) {
    throw new Error("Verification failed.");
  }

  return res.data.data;
}

export async function resetPassword(payload: {
  email: string;
  verificationToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await api.post("/auth/reset-password", payload);
}

export async function refresh(): Promise<void> {
  await api.post("/auth/refresh");
}

export async function getMe(): Promise<AuthUser | null> {
  const res = await api.get<AuthUserEnvelope>("/auth/me");
  return res.data?.data?.user ?? null;
}

export async function updateMe(payload: {
  fullName: string;
  email: string;
  phoneNumber?: string;
}): Promise<AuthUser | null> {
  const res = await api.patch<AuthUserEnvelope>("/auth/me", payload);
  return res.data?.data?.user ?? null;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<void> {
  await api.post("/auth/change-password", payload);
}

export async function getMySessions(): Promise<AuthSessionItem[]> {
  const res = await api.get<SessionsEnvelope>("/auth/sessions");
  return res.data?.data?.sessions ?? [];
}

export async function logoutOthers(): Promise<void> {
  await api.post("/auth/logout-others");
}

export async function revokeMySession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
