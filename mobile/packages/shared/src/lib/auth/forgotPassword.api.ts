import { api, unwrap } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

export type ForgotPasswordRequestResult = {
  ttlMinutes: number;
  resendCooldownSeconds: number;
};

export type ForgotPasswordVerifyResult = {
  verificationToken: string;
  expiresInMinutes: number;
};

export async function forgotPasswordRequest(
  email: string,
): Promise<ForgotPasswordRequestResult> {
  const res = await api.post(API_ENDPOINTS.auth.forgotPasswordRequest, {
    email,
  });
  const data = unwrap<ForgotPasswordRequestResult>(res.data);
  return (
    data ?? { ttlMinutes: 10, resendCooldownSeconds: 60 }
  );
}

export async function forgotPasswordVerify(
  email: string,
  otp: string,
): Promise<ForgotPasswordVerifyResult> {
  const res = await api.post(API_ENDPOINTS.auth.forgotPasswordVerify, {
    email,
    otp,
  });
  const data = unwrap<ForgotPasswordVerifyResult>(res.data);
  if (!data?.verificationToken) {
    throw new Error("OTP verification did not return a token.");
  }
  return data;
}

export async function resetPassword(input: {
  email: string;
  verificationToken: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await api.post(API_ENDPOINTS.auth.resetPassword, input);
}
