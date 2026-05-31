import { api, unwrap } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

export type RegisterRequestOtpResult = {
  emailHash: string;
  ttlMinutes: number;
  resendCooldownSeconds: number;
};

export type VerifyOtpResult = {
  emailVerificationToken: string;
  expiresInMinutes: number;
};

export type RegisterPassengerInput = {
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
};

export type RegisterPassengerResult = {
  user: {
    id: string;
    fullName: string;
    email: string;
    approvalStatus: string;
  };
};

export async function requestRegisterOtp(
  email: string,
): Promise<RegisterRequestOtpResult> {
  const res = await api.post(API_ENDPOINTS.auth.requestRegisterOtp, { email });
  const data = unwrap<RegisterRequestOtpResult>(res.data);
  return (
    data ?? {
      emailHash: "",
      ttlMinutes: 10,
      resendCooldownSeconds: 60,
    }
  );
}

export async function verifyRegisterOtp(
  email: string,
  otp: string,
): Promise<VerifyOtpResult> {
  const res = await api.post(API_ENDPOINTS.auth.verifyRegisterOtp, {
    email,
    otp,
  });
  const data = unwrap<VerifyOtpResult>(res.data);
  if (!data?.emailVerificationToken) {
    throw new Error("OTP verification did not return a verification token.");
  }
  return data;
}

export async function registerPassenger(
  input: RegisterPassengerInput,
): Promise<RegisterPassengerResult> {
  const res = await api.post(API_ENDPOINTS.auth.register, input);
  const data = unwrap<RegisterPassengerResult>(res.data);
  if (!data?.user) {
    throw new Error("Registration succeeded but no user object returned.");
  }
  return data;
}
