"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionSkeleton } from "@/components/states/section-skeleton";
import { ErrorState } from "@/components/states/error-state";
import { getApiErrorMessage } from "@/lib/api/error";
import { useToast } from "@/providers/toast-provider";
import { AdminConfirmModal } from "../../shared/components/admin-confirm-modal";
import {
  getAdminUserSessionDashboard,
  revokeAdminSession,
} from "../api/admin.user-sessions.api";
import type {
  AdminUserSessionDashboardResponse,
  AdminUserSessionItem,
} from "../api/admin.user-sessions.api";

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function SessionRow({
  session,
  onAskRevoke,
}: {
  session: AdminUserSessionItem;
  onAskRevoke: (session: AdminUserSessionItem) => void;
}) {
  return (
    <tr className="border-b border-slate-800 last:border-b-0">
      <td className="px-4 py-4 align-top">
        <div className="font-medium text-slate-100">
          {session.deviceLabel || "Unnamed device"}
        </div>
        <div className="mt-1 text-xs text-slate-500 break-all">
          {session.userAgentRaw || "No user agent"}
        </div>
      </td>

      <td className="px-4 py-4 align-top text-slate-400">
        <div>
          {session.lastSeenIp || session.ipLast || session.ipFirst || "—"}
        </div>
        <div className="mt-1 text-xs text-slate-500 break-all">
          Family: {session.refreshFamilyId}
        </div>
      </td>

      <td className="px-4 py-4 align-top text-slate-400">
        <div>Created: {formatDateTime(session.createdAt)}</div>
        <div className="mt-1">
          Last seen: {formatDateTime(session.lastSeenAt)}
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap gap-2">
          <Badge tone={session.active ? "success" : "warning"}>
            {session.active ? "Active" : "Revoked"}
          </Badge>

          {session.isCurrent ? <Badge tone="info">Current</Badge> : null}

          <Badge tone="neutral">{session.roleSnapshot}</Badge>
        </div>

        {session.revokedReason ? (
          <p className="mt-2 text-xs text-slate-500">
            Reason: {session.revokedReason}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4 text-right align-top">
        {session.isCurrent ? (
          <span className="text-xs text-slate-500">Current session</span>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={!session.active}
            onClick={() => onAskRevoke(session)}
          >
            Revoke
          </Button>
        )}
      </td>
    </tr>
  );
}

export function UserSessionDashboardModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const toast = useToast();

  const [data, setData] = useState<AdminUserSessionDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const [confirmSession, setConfirmSession] =
    useState<AdminUserSessionItem | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAdminUserSessionDashboard(userId);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load session dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [userId]);

  const revokableSessions = useMemo(() => {
    return (data?.sessions ?? []).filter(
      (session) => session.active && !session.isCurrent,
    );
  }, [data]);

  // The backend session-dashboard endpoint returns only { user, sessions }.
  // Derive the summary and latest-seen session on the client so the dashboard
  // renders without depending on optional server-computed fields.
  const sessions = useMemo(() => data?.sessions ?? [], [data]);

  const summary = useMemo(() => {
    const activeSessions = sessions.filter((s) => s.active).length;
    const sessionFamilies = new Set(
      sessions.map((s) => s.refreshFamilyId).filter(Boolean),
    ).size;

    return {
      totalSessions: sessions.length,
      activeSessions,
      revokedSessions: sessions.length - activeSessions,
      sessionFamilies,
    };
  }, [sessions]);

  const latestSeenSession = useMemo(() => {
    return sessions.reduce<AdminUserSessionItem | null>((latest, session) => {
      if (!session.lastSeenAt) return latest;
      if (!latest?.lastSeenAt) return session;
      return new Date(session.lastSeenAt).getTime() >
        new Date(latest.lastSeenAt).getTime()
        ? session
        : latest;
    }, null);
  }, [sessions]);

  async function handleRevoke(session: AdminUserSessionItem) {
    try {
      setRevokingId(session.id);
      await revokeAdminSession(session.id);
      toast.success(
        "Session revoked",
        `${session.deviceLabel || "Selected session"} has been revoked.`,
      );
      setConfirmSession(null);
      await load();
    } catch (err) {
      toast.danger("Revoke failed", getApiErrorMessage(err));
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAllOtherActive() {
    if (revokableSessions.length === 0) return;

    try {
      setBulkRevoking(true);

      for (const session of revokableSessions) {
        await revokeAdminSession(session.id);
      }

      toast.success(
        "Sessions revoked",
        "All other active sessions for this user have been revoked.",
      );
      setConfirmBulk(false);
      await load();
    } catch (err) {
      toast.danger("Bulk revoke failed", getApiErrorMessage(err));
    } finally {
      setBulkRevoking(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-6xl rounded-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-100">
                  User Session Dashboard
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Inspect active and historical sessions for the selected user.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => setConfirmBulk(true)}
                  disabled={bulkRevoking || revokableSessions.length === 0}
                >
                  {bulkRevoking ? "Revoking..." : "Revoke All Other Active"}
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>

            {loading ? <SectionSkeleton /> : null}

            {!loading && error ? (
              <ErrorState description={error} onRetry={() => void load()} />
            ) : null}

            {!loading && !error && data ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">User</p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {data.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {data.user.email}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">Active sessions</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">
                        {summary.activeSessions}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">Revoked sessions</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">
                        {summary.revokedSessions}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">Session families</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">
                        {summary.sessionFamilies}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="space-y-3 p-5">
                    <h4 className="text-sm font-semibold text-slate-100">
                      Latest Seen Session
                    </h4>

                    {latestSeenSession ? (
                      <div className="rounded-sm border border-slate-800 px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            tone={
                              latestSeenSession.active ? "success" : "warning"
                            }
                          >
                            {latestSeenSession.active ? "Active" : "Revoked"}
                          </Badge>
                          <span className="text-sm font-medium text-slate-100">
                            {latestSeenSession.deviceLabel || "Unnamed device"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          Last seen:{" "}
                          {formatDateTime(latestSeenSession.lastSeenAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Last IP: {latestSeenSession.lastSeenIp || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 break-all">
                          Family: {latestSeenSession.refreshFamilyId}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
                        No session activity found.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-4 p-0">
                    <div className="px-5 pt-5">
                      <div className="flex items-start gap-3 rounded-sm border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          Admin revoke actions are available for active
                          non-current sessions. Current sessions are not
                          revocable from this view.
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1120px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-slate-500">
                            <th className="px-4 py-3">Device</th>
                            <th className="px-4 py-3">IP / Family</th>
                            <th className="px-4 py-3">Timeline</th>
                            <th className="px-4 py-3">State</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {sessions.map((session) => (
                            <SessionRow
                              key={session.id}
                              session={session}
                              onAskRevoke={setConfirmSession}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {confirmSession ? (
        <AdminConfirmModal
          tone="danger"
          title="Revoke session"
          description="You are about to revoke this session."
          warning="The user will be logged out immediately from this device/session."
          details={[
            { label: "Device", value: confirmSession.deviceLabel },
            { label: "Last IP", value: confirmSession.lastSeenIp },
            {
              label: "Last seen",
              value: formatDateTime(confirmSession.lastSeenAt),
            },
          ]}
          confirmLabel="Revoke session"
          submitting={revokingId === confirmSession.id}
          onConfirm={() => handleRevoke(confirmSession)}
          onClose={() => setConfirmSession(null)}
        />
      ) : null}

      {confirmBulk ? (
        <AdminConfirmModal
          tone="danger"
          title="Revoke all other active sessions"
          description="You are about to revoke all other active sessions for this user."
          warning="All other currently active devices will be logged out immediately."
          details={[
            { label: "Revokable sessions", value: revokableSessions.length },
          ]}
          confirmLabel="Revoke all"
          submitting={bulkRevoking}
          onConfirm={handleRevokeAllOtherActive}
          onClose={() => setConfirmBulk(false)}
        />
      ) : null}
    </>
  );
}
