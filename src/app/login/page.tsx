"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BusFront,
  Clock3,
  LockKeyhole,
  Mail,
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <style jsx>{`
        @keyframes login-card-in {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .login-card {
          animation: login-card-in 0.4s ease-out;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[360px] w-[360px] rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(2,6,23,0.55)_100%)]" />
      </div>

      <Card className="login-card relative w-full max-w-md border-slate-800/80 shadow-2xl shadow-blue-950/40">
        <CardHeader>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
              <BusFront className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                University
              </p>
              <p className="text-sm font-semibold text-slate-200">
                Bus Tracking System
              </p>
            </div>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue to your dashboard
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

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              New passenger?
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <Link href="/register" className="mt-4 block">
            <Button
              variant="secondary"
              className="h-11 w-full border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/25 hover:text-emerald-100 focus-visible:ring-emerald-500/40"
            >
              <UserPlus className="h-4 w-4" />
              Register as passenger
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
