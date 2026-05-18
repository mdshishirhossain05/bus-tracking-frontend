"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, UserCircle2, Smartphone, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import {
  changePassword,
  getMySessions,
  logoutOthers,
  revokeMySession,
} from "@/features/auth/api/auth.api";
import { getApiErrorMessage } from "@/lib/api/error";
import type { AuthSessionItem } from "@/types/auth";

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function AccountPage() {
  const { user, updateProfile, refreshSession, logout } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [revokingOthers, setRevokingOthers] = useState(false);

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
    });
  }, [user?.fullName, user?.email]);

  async function loadSessions() {
    try {
      setSessionsLoading(true);
      const data = await getMySessions();
      setSessions(data);
    } catch (error) {
      toast.danger("Failed to load sessions", getApiErrorMessage(error));
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  const otherActiveSessions = useMemo(() => {
    return sessions.filter((session) => !session.current && !session.revokedAt);
  }, [sessions]);

  async function handleProfileSave() {
    try {
      setProfileSubmitting(true);

      await updateProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim().toLowerCase(),
      });

      await refreshSession();

      toast.success("Profile updated", "Your account profile has been updated.");
    } catch (error) {
      toast.danger("Profile update failed", getApiErrorMessage(error));
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePasswordChange() {
    try {
      setPasswordSubmitting(true);

      const currentPassword = passwordForm.currentPassword.trim();
      const newPassword = passwordForm.newPassword.trim();
      const confirmNewPassword = passwordForm.confirmNewPassword.trim();

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new Error("All password fields are required.");
      }

      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      await loadSessions();

      toast.success(
        "Password changed",
        "Your password has been updated and other sessions were logged out.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getApiErrorMessage(error);

      toast.danger("Password change failed", message);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  async function handleLogoutOthers() {
    try {
      setRevokingOthers(true);
      await logoutOthers();
      await loadSessions();
      toast.success(
        "Other sessions revoked",
        "All other active sessions were logged out.",
      );
    } catch (error) {
      toast.danger("Failed to revoke other sessions", getApiErrorMessage(error));
    } finally {
      setRevokingOthers(false);
    }
  }

  async function handleRevokeSession(sessionId: string, isCurrent: boolean) {
    try {
      setRevokingSessionId(sessionId);
      await revokeMySession(sessionId);

      if (isCurrent) {
        toast.info(
          "Session revoked",
          "Current session was revoked. Please sign in again.",
        );
        await logout();
        return;
      }

      await loadSessions();
      toast.success("Session revoked", "Selected session has been revoked.");
    } catch (error) {
      toast.danger("Failed to revoke session", getApiErrorMessage(error));
    } finally {
      setRevokingSessionId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-slate-800 p-3 text-slate-300">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your name and email address used in this system.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Full name
                </label>
                <Input
                  value={profileForm.fullName}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Role
                </label>
                <Input value={user?.role ?? "N/A"} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email
              </label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Email"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => void handleProfileSave()}
                disabled={profileSubmitting}
              >
                {profileSubmitting ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-sm bg-slate-800 p-3 text-slate-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Change your password and protect access to your account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Current password
                </label>
                <PasswordInput
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  New password
                </label>
                <PasswordInput
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Confirm new password
                </label>
                <PasswordInput
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => void handlePasswordChange()}
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? "Updating..." : "Change password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-sm bg-slate-800 p-3 text-slate-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    Review device sessions and revoke access when needed.
                  </CardDescription>
                </div>
              </div>

              <Button
                variant="danger"
                onClick={() => void handleLogoutOthers()}
                disabled={revokingOthers || otherActiveSessions.length === 0}
              >
                {revokingOthers ? "Revoking..." : "Logout others"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-6 text-sm text-slate-500">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-sm border border-slate-800 bg-slate-950 px-4 py-6 text-sm text-slate-500">
                No session records found.
              </div>
            ) : (
              sessions.map((session) => {
                const isCurrent = Boolean(session.current);
                const revoked = Boolean(session.revokedAt);

                return (
                  <div
                    key={session.id}
                    className="rounded-sm border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-100">
                            {session.deviceLabel || "Unnamed device"}
                          </p>
                          <Badge tone={revoked ? "warning" : "success"}>
                            {revoked ? "Revoked" : "Active"}
                          </Badge>
                          {isCurrent ? <Badge tone="info">Current</Badge> : null}
                        </div>
                        <p className="mt-2 break-all text-xs text-slate-500">
                          {session.userAgentRaw || "No user agent"}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Last seen: {formatDateTime(session.lastSeenAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Last IP:{" "}
                          {session.lastSeenIp ||
                            session.ipLast ||
                            session.ipFirst ||
                            "N/A"}
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() =>
                          void handleRevokeSession(session.id, isCurrent)
                        }
                        disabled={revokingSessionId === session.id || revoked}
                      >
                        <Trash2 className="h-4 w-4" />
                        {revokingSessionId === session.id
                          ? "Revoking..."
                          : "Revoke"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}