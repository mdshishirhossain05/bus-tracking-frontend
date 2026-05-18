"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  XCircle,
} from "lucide-react";
import { resetPassword } from "@/features/auth/api/auth.api";
import {
  clearForgotPasswordFlow,
  readForgotPasswordFlow,
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
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error";

function getPasswordRules(password: string, confirmPassword: string) {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
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

export default function ForgotPasswordResetPage() {
  const router = useRouter();
  const toast = useToast();

  const [flow, setFlow] = useState<{
    email: string;
    verificationToken: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    // Deferred so the sessionStorage read runs only on the client, after mount.
    void Promise.resolve().then(() => {
      if (!active) return;

      const state = readForgotPasswordFlow();
      if (state?.email && state.verificationToken) {
        setFlow({
          email: state.email,
          verificationToken: state.verificationToken,
        });
      } else {
        router.replace("/forgot-password");
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  const rules = useMemo(
    () => getPasswordRules(password, confirmPassword),
    [password, confirmPassword],
  );
  const allValid = rules.every((rule) => rule.valid);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flow) return;

    setError("");

    if (!allValid) {
      setError("Please satisfy every password requirement before continuing.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        email: flow.email,
        verificationToken: flow.verificationToken,
        newPassword: password,
        confirmPassword,
      });
      clearForgotPasswordFlow();
      toast.success(
        "Password updated",
        "Sign in with your new password to continue.",
      );
      router.replace("/login?reason=password-reset");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "We could not reset your password. Please restart the process.",
        ),
      );
      setSubmitting(false);
    }
  };

  if (!flow) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-sm text-slate-400">
            Loading…
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a strong password for{" "}
            <span className="font-medium text-slate-100">{flow.email}</span>.
            All other sessions will be signed out.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                New password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Create a strong password"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
                        className={`h-1.5 flex-1 rounded-sm transition-colors ${
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
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="Re-enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
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
              {rules.map((rule) => (
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

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={submitting || !allValid}
            >
              {submitting ? "Updating password..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
