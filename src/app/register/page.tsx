"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BusFront,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import {
  getPublicRegistrationSettings,
  registerPassenger,
  requestPassengerRegistrationOtp,
  verifyPassengerRegistrationOtp,
} from "@/features/auth/api/auth.api";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { getApiErrorMessage } from "@/lib/api/error";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Verify email", "Your details", "Password"] as const;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getPasswordRules(password: string, confirmPassword: string) {
  return [
    { id: "length", label: "At least 8 characters", valid: password.length >= 8 },
    {
      id: "uppercase",
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      id: "lowercase",
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    { id: "number", label: "One number", valid: /[0-9]/.test(password) },
    {
      id: "special",
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
    {
      id: "match",
      label: "Passwords match",
      valid: password.length > 0 && password === confirmPassword,
    },
  ];
}

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-300">
      {children}
    </label>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < current;
        const isActive = stepNumber === current;

        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
              </div>
            </div>
            {index < STEP_LABELS.length - 1 ? (
              <div
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  isDone ? "bg-emerald-500" : "bg-slate-800"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [academicDepartment, setAcademicDepartment] = useState("");
  const [academicBatch, setAcademicBatch] = useState("");
  const [transportPickupPoint, setTransportPickupPoint] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(
    null,
  );

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const emailIsVerified =
    Boolean(emailVerificationToken) && verifiedEmail === normalizedEmail;

  const passwordRules = useMemo(
    () => getPasswordRules(password, confirmPassword),
    [password, confirmPassword],
  );
  const passwordIsValid = passwordRules.every((rule) => rule.valid);

  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(4, score);
  }, [password]);

  const detailsComplete =
    fullName.trim().length >= 2 &&
    studentId.trim().length >= 3 &&
    phoneNumber.trim().length >= 7 &&
    academicDepartment.trim().length > 0 &&
    academicBatch.trim().length > 0 &&
    transportPickupPoint.trim().length > 0;

  useEffect(() => {
    void (async () => {
      try {
        const settings = await getPublicRegistrationSettings();
        setRegistrationEnabled(settings.passengerSelfRegistrationEnabled);
      } catch {
        setRegistrationEnabled(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  async function handleRequestOtp() {
    setError("");

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address before requesting a code.");
      return;
    }

    setRequestingOtp(true);

    try {
      const result = await requestPassengerRegistrationOtp({
        email: normalizedEmail,
      });
      setOtpSentTo(result.email);
      setOtp("");
      setOtpCooldown(result.resendAfterSeconds ?? 60);
      toast.success(
        "Code sent",
        "A 6-digit verification code has been sent to your email.",
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to send verification code. Please try again.",
        ),
      );
    } finally {
      setRequestingOtp(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    setError("");

    if (!otpSentTo || otpSentTo !== normalizedEmail) {
      setError("Please request a verification code for this email first.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const result = await verifyPassengerRegistrationOtp({
        email: normalizedEmail,
        otp: code,
      });
      setVerifiedEmail(result.email);
      setEmailVerificationToken(result.emailVerificationToken);
      toast.success("Email verified", "Continue with your registration.");
      setStep(2);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Email verification failed. Please check the code and try again.",
        ),
      );
      setOtp("");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit() {
    setError("");

    if (!emailIsVerified) {
      setError("Please verify your email before submitting.");
      setStep(1);
      return;
    }

    if (!passwordIsValid) {
      setError("Please satisfy every password requirement before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      await registerPassenger({
        fullName: fullName.trim(),
        email: normalizedEmail,
        password,
        confirmPassword,
        studentId: studentId.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        academicDepartment: academicDepartment.trim() || undefined,
        academicBatch: academicBatch.trim() || undefined,
        transportPickupPoint: transportPickupPoint.trim() || undefined,
        emailVerificationToken,
      });
      toast.success(
        "Registration submitted",
        "Your account is now awaiting admin approval.",
      );
      setCompleted(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Registration failed. Please review your information and try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (registrationEnabled === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
        <Card className="w-full max-w-xl rounded-sm">
          <CardContent className="p-6 text-sm text-slate-500">
            Loading registration availability...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!registrationEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
        <Card className="w-full max-w-xl rounded-sm">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Passenger registration unavailable</CardTitle>
            <CardDescription>
              Public self-registration is currently disabled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-300">
              Passenger self-registration has been turned off by the
              administrator. Please contact the transport or system
              administrator for account creation.
            </div>
            <Link href="/login">
              <Button variant="secondary">Go to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (completed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
        <Card className="w-full max-w-xl rounded-sm">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Registration submitted</CardTitle>
            <CardDescription>
              Your passenger account is pending admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
              Your registration has been received. You will be able to sign in
              once an administrator approves your account.
            </div>
            <Link href="/login">
              <Button className="w-full sm:w-auto">Go to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <style jsx>{`
        @keyframes register-step-in {
          from {
            opacity: 0;
            transform: translateX(14px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .register-step {
          animation: register-step-in 0.28s ease-out;
        }
      `}</style>

      <Card className="w-full max-w-xl rounded-sm">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
            <BusFront className="h-6 w-6" />
          </div>
          <CardTitle>Register as passenger</CardTitle>
          <CardDescription>
            Step {step} of 3 — {STEP_LABELS[step - 1]}
          </CardDescription>
          <div className="mt-4">
            <StepIndicator current={step} />
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <div key="step-1" className="register-step space-y-4">
              <div>
                <FieldLabel>Email address</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setOtpSentTo("");
                        setOtp("");
                        setEmailVerificationToken("");
                        setVerifiedEmail("");
                      }}
                      className="pl-9"
                      placeholder="Enter your personal email"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 sm:w-[150px]"
                    disabled={
                      requestingOtp ||
                      otpCooldown > 0 ||
                      !isValidEmail(normalizedEmail)
                    }
                    onClick={() => void handleRequestOtp()}
                  >
                    {requestingOtp
                      ? "Sending..."
                      : otpCooldown > 0
                        ? `${otpCooldown}s`
                        : otpSentTo
                          ? "Resend"
                          : "Send code"}
                  </Button>
                </div>
              </div>

              {otpSentTo ? (
                <div className="rounded-sm border border-slate-800 bg-slate-800/40 p-4">
                  <p className="mb-3 text-sm text-slate-500">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-slate-100">
                      {otpSentTo}
                    </span>
                  </p>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={verifyingOtp}
                    autoFocus
                    onComplete={handleVerifyOtp}
                  />
                  {otpCooldown === 0 ? (
                    <button
                      type="button"
                      onClick={() => void handleRequestOtp()}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-slate-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Resend verification code
                    </button>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <Button
                type="button"
                className="h-11 w-full"
                disabled={verifyingOtp || otp.length !== 6}
                onClick={() => void handleVerifyOtp(otp)}
              >
                {verifyingOtp ? "Verifying..." : "Verify & continue"}
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div key="step-2" className="register-step space-y-4">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Student ID</FieldLabel>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="pl-9"
                      placeholder="Your student ID"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Phone number</FieldLabel>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-9"
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Academic department</FieldLabel>
                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={academicDepartment}
                      onChange={(e) => setAcademicDepartment(e.target.value)}
                      className="pl-9"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Academic batch</FieldLabel>
                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={academicBatch}
                      onChange={(e) => setAcademicBatch(e.target.value)}
                      className="pl-9"
                      placeholder="e.g. 2022"
                    />
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel>Transport pickup point</FieldLabel>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={transportPickupPoint}
                    onChange={(e) => setTransportPickupPoint(e.target.value)}
                    className="pl-9"
                    placeholder="Your usual boarding stop"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 sm:w-auto"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1"
                  disabled={!detailsComplete}
                  onClick={() => {
                    setError("");
                    setStep(3);
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div key="step-3" className="register-step space-y-4">
              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="Create a strong password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-500"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password ? (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            index < strength
                              ? STRENGTH_COLORS[strength]
                              : "bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Password strength: {STRENGTH_LABELS[strength]}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-500"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-2 text-xs ${
                      rule.valid ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {rule.valid ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {rule.label}
                  </div>
                ))}
              </div>

              {error ? (
                <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 sm:w-auto"
                  onClick={() => {
                    setError("");
                    setStep(2);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1"
                  disabled={submitting || !passwordIsValid}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? "Submitting..." : "Submit registration"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 text-sm text-slate-500">
            Already have an approved account?{" "}
            <Link
              href="/login"
              className="font-medium text-slate-100 underline"
            >
              Go to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
