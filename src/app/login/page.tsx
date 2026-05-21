"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, LockKeyhole, Mail, ShieldCheck, XCircle } from "lucide-react";
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
      <Card className="w-full max-w-md">
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

          <div className="mt-6">
            <p className="mb-2 text-center text-sm text-slate-400">
              New passenger?
            </p>
            <Link href="/register" className="block">
              <Button variant="secondary" className="h-11 w-full">
                Register as passenger
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
