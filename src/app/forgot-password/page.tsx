"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { requestPasswordReset } from "@/features/auth/api/auth.api";
import { saveForgotPasswordFlow } from "@/features/auth/forgot-password/flow-state";
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      await requestPasswordReset({ email: normalizedEmail });
      saveForgotPasswordFlow({ email: normalizedEmail });
      router.push(
        `/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`,
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "We could not start the password reset. Please try again.",
        ),
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-blue-600 text-white">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter the email address linked to your account and we will send a
            verification code.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoFocus
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? "Sending code..." : "Send verification code"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            For your security, we will always show the same confirmation
            whether or not an account exists for this email.
          </div>

          <div className="mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
