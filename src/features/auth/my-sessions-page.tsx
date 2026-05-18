"use client";

import { useState } from "react";
import { PageSection } from "@/components/layout/page-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { AdminConfirmModal } from "@/features/admin/shared/components/admin-confirm-modal";
import type { AuthSessionItem } from "./api/auth.sessions.api";
import { MySessionsTable } from "./components/my-sessions-table";
import { useAuthSessions } from "./hooks/use-auth-sessions";

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

type ConfirmState =
  | { type: "revoke"; session: AuthSessionItem }
  | { type: "logout-others" }
  | { type: "logout-all" }
  | null;

export function MySessionsPage() {
  const toast = useToast();
  const { logout } = useAuth();
  const { sessions, summary, loading, reload, logoutAll, logoutOthers, revokeSession } =
    useAuthSessions();

  const [loadFailed, setLoadFailed] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<"others" | "all" | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  async function handleReload() {
    try {
      setLoadFailed(false);
      await reload();
    } catch {
      setLoadFailed(true);
    }
  }

  async function handleLogoutOthers() {
    try {
      setBulkLoading("others");
      await logoutOthers();
      toast.success(
        "Other sessions logged out",
        "All other active sessions have been revoked.",
      );
      setConfirm(null);
      await handleReload();
    } catch (error) {
      toast.danger("Action failed", getApiErrorMessage(error));
    } finally {
      setBulkLoading(null);
    }
  }

  async function handleLogoutAll() {
    try {
      setBulkLoading("all");
      await logoutAll();
      toast.success(
        "All sessions logged out",
        "Your active sessions have been revoked.",
      );
      setConfirm(null);
      await logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session-expired";
      }
    } catch (error) {
      toast.danger("Action failed", getApiErrorMessage(error));
      setBulkLoading(null);
    }
  }

  async function handleRevoke(session: AuthSessionItem) {
    try {
      setRevokingId(session.id);
      await revokeSession(session.id);
      toast.success(
        "Session revoked",
        `${session.deviceLabel || "Selected session"} has been revoked.`,
      );
      setConfirm(null);
      await handleReload();
    } catch (error) {
      toast.danger("Revoke failed", getApiErrorMessage(error));
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return <SectionSkeleton />;
  }

  if (loadFailed) {
    return (
      <ErrorState
        description="Your session inventory could not be loaded."
        onRetry={() => void handleReload()}
      />
    );
  }

  return (
    <>
      <PageSection
        title="My Sessions & Security"
        description="Review active devices, recent session activity, and revoke sessions you no longer trust."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void handleReload()}>
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirm({ type: "logout-others" })}
              disabled={bulkLoading !== null}
            >
              {bulkLoading === "others" ? "Logging out others..." : "Logout Others"}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirm({ type: "logout-all" })}
              disabled={bulkLoading !== null}
            >
              {bulkLoading === "all" ? "Logging out all..." : "Logout All"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Total sessions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {summary.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Active sessions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {summary.active}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Revoked sessions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">
                {summary.revoked}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Current session</p>
              <p className="mt-2 text-base font-semibold text-slate-100">
                {summary.current?.deviceLabel || "Unnamed device"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Last seen: {formatDateTime(summary.current?.lastSeenAt ?? null)}
              </p>
            </CardContent>
          </Card>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions found"
            description="There are no sessions available to display for this account."
          />
        ) : (
          <MySessionsTable
            sessions={sessions}
            revokingId={revokingId}
            onRevoke={(session) => setConfirm({ type: "revoke", session })}
          />
        )}
      </PageSection>

      {confirm?.type === "revoke" ? (
        <AdminConfirmModal
          tone="danger"
          title="Revoke session"
          description="You are about to revoke this session."
          warning="This device/session will be logged out immediately."
          details={[
            { label: "Device", value: confirm.session.deviceLabel },
            { label: "Last IP", value: confirm.session.lastSeenIp },
            { label: "Last seen", value: formatDateTime(confirm.session.lastSeenAt) },
          ]}
          confirmLabel="Revoke session"
          submitting={revokingId === confirm.session.id}
          onConfirm={() => handleRevoke(confirm.session)}
          onClose={() => setConfirm(null)}
        />
      ) : null}

      {confirm?.type === "logout-others" ? (
        <AdminConfirmModal
          tone="warning"
          title="Logout other sessions"
          description="You are about to log out all other active sessions."
          warning="Other devices currently signed into your account will be logged out."
          details={[{ label: "Other active sessions", value: Math.max(summary.active - 1, 0) }]}
          confirmLabel="Logout others"
          submitting={bulkLoading === "others"}
          onConfirm={handleLogoutOthers}
          onClose={() => setConfirm(null)}
        />
      ) : null}

      {confirm?.type === "logout-all" ? (
        <AdminConfirmModal
          tone="danger"
          title="Logout all sessions"
          description="You are about to log out all active sessions, including this one."
          warning="You will be redirected to login immediately after this action."
          details={[{ label: "Active sessions", value: summary.active }]}
          confirmLabel="Logout all"
          submitting={bulkLoading === "all"}
          onConfirm={handleLogoutAll}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </>
  );
}