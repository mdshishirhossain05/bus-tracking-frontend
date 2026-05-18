"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
} from "@/features/auth/api/auth.api";
import {
  readForgotPasswordFlow,
  saveForgotPasswordFlow,
} from "@/features/auth/forgot-password/flow-state";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpInput } from "@/components/ui/otp-input";
import { getApiErrorMessage } from "@/lib/api/error";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const email = useMemo(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery) return fromQuery.trim().toLowerCase();
    return readForgotPasswordFlow()?.email ?? "";
  }, [searchParams]);

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (code: string) => {
    if (!email || code.length !== 6 || verifying) return;

    setError("");
    setVerifying(true);

    try {
      const result = await verifyPasswordResetOtp({ email, otp: code });
      saveForgotPasswordFlow({
        email,
        verificationToken: result.verificationToken,
      });
      router.push(`/forgot-password/reset?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "That verification code is invalid or expired. Please try again.",
        ),
      );
      setOtp("");
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setError("");
    setResending(true);

    try {
      await requestPasswordReset({ email });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp("");
      toast.success(
        "Code resent",
        "If an account exists, a new code is on its way.",
      );
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not resend the code. Please try again."),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to{" "}
            <span className="font-medium text-slate-100">{email}</span>. Enter
            it below to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={verifying}
              autoFocus
              onComplete={handleVerify}
            />

            {error ? (
              <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              className="h-11 w-full"
              disabled={verifying || otp.length !== 6}
              onClick={() => void handleVerify(otp)}
            >
              {verifying ? "Verifying..." : "Verify code"}
            </Button>

            <div className="flex items-center justify-center text-sm text-slate-400">
              {cooldown > 0 ? (
                <span>Resend available in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={resending}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-slate-100 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {resending ? "Resending..." : "Resend verification code"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Use a different email
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
