"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BusFront,
  Clock3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { login } from "@/features/auth/api/auth.api";
import { useAuth } from "@/providers/auth-provider";
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
import { PasswordInput } from "@/components/ui/password-input";
import { getApiErrorMessage } from "@/lib/api/error";

function extractErrorCode(error: unknown): string | null {
  const maybeAxios = error as {
    response?: {
      data?: {
        code?: string;
      };
    };
  };

  return maybeAxios?.response?.data?.code ?? null;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const reason = searchParams.get("reason");

  const { refreshSession } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [statusTone, setStatusTone] = useState<"error" | "warning" | "info">(
    "error",
  );

  const helperMessage = useMemo(() => {
    if (reason === "session-expired") {
      return "Your session expired. Please sign in again to continue.";
    }
    if (reason === "password-reset") {
      return "Your password was reset successfully. Please sign in with your new password.";
    }
    return "";
  }, [reason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setStatusTone("error");

    try {
      await login({ email, password });
      await refreshSession();
      success("Signed in successfully", "Your session is now active.");
      router.replace(next);
    } catch (err) {
      const code = extractErrorCode(err);

      if (code === "PASSENGER_PENDING_APPROVAL") {
        setStatusTone("warning");
        setError(
          "Your passenger account is pending admin approval. Please wait until an administrator approves your registration.",
        );
      } else if (code === "PASSENGER_REGISTRATION_REJECTED") {
        setStatusTone("error");
        setError(
          getApiErrorMessage(
            err,
            "Your passenger registration was rejected. Please contact the administrator if you need help.",
          ),
        );
      } else {
        setStatusTone("error");
        setError(
          getApiErrorMessage(
            err,
            "Login failed. Please check your credentials.",
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusBoxClass =
    statusTone === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : statusTone === "info"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
        : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <Card className="hidden overflow-hidden bg-slate-900 lg:block">
          <CardContent className="flex h-full flex-col justify-between p-8">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-blue-600 text-white">
                <BusFront className="h-7 w-7" />
              </div>

              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-100">
                University Bus Tracking System
              </h1>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                Sign in to access realtime passenger tracking, driver
                operations, administrative control, account settings, and
                session-aware platform access.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-sm border border-slate-800 bg-slate-800/40 px-4 py-4">
                <p className="text-sm font-medium text-slate-200">
                  Passenger experience
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Live movement, ETA, and route-aware visibility.
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-800/40 px-4 py-4">
                <p className="text-sm font-medium text-slate-200">
                  Driver operations
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Trip lifecycle, GPS publishing, and live map control.
                </p>
              </div>

              <div className="rounded-sm border border-slate-800 bg-slate-800/40 px-4 py-4">
                <p className="text-sm font-medium text-slate-200">
                  Admin control
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Operations monitoring, user management, and session
                  visibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Access the University Bus Tracking System
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {helperMessage ? (
                <div className="rounded-sm border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
                  {helperMessage}
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-slate-400 hover:text-slate-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  leftIcon={<LockKeyhole className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error ? (
                <div
                  className={`rounded-sm border px-3 py-3 text-sm ${statusBoxClass}`}
                >
                  <div className="flex items-start gap-2">
                    {statusTone === "warning" ? (
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 rounded-sm border border-slate-800 bg-slate-800/40 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-sm bg-blue-600 text-white">
                  <UserPlus className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-100">
                    New passenger?
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Create a passenger account using your personal email and
                    student ID. Your registration will stay pending until
                    approved by admin.
                  </p>

                  <div className="mt-3">
                    <Link href="/register">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Register as passenger
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
