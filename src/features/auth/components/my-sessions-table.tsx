"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthSessionItem } from "../api/auth.sessions.api";

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export function MySessionsTable({
  sessions,
  revokingId,
  onRevoke,
}: {
  sessions: AuthSessionItem[];
  revokingId: string | null;
  onRevoke: (session: AuthSessionItem) => void;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="px-5 py-4">Device</th>
              <th className="px-5 py-4">IP / Family</th>
              <th className="px-5 py-4">Timeline</th>
              <th className="px-5 py-4">State</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="border-b border-slate-800 last:border-b-0"
              >
                <td className="px-5 py-4 align-top">
                  <div className="font-medium text-slate-100">
                    {session.deviceLabel || "Unnamed device"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 break-all">
                    {session.userAgentRaw || "No user agent"}
                  </div>
                </td>

                <td className="px-5 py-4 align-top text-slate-400">
                  <div>
                    {session.lastSeenIp || session.ipLast || session.ipFirst || "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 break-all">
                    {session.refreshFamilyId || "No family id"}
                  </div>
                </td>

                <td className="px-5 py-4 align-top text-slate-400">
                  <div>Created: {formatDateTime(session.createdAt)}</div>
                  <div className="mt-1">
                    Last seen: {formatDateTime(session.lastSeenAt)}
                  </div>
                </td>

                <td className="px-5 py-4 align-top">
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

                <td className="px-5 py-4 text-right align-top">
                  {session.isCurrent ? (
                    <span className="text-xs text-slate-500">Current session</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onRevoke(session)}
                      disabled={revokingId === session.id || !session.active}
                    >
                      {revokingId === session.id ? "Revoking..." : "Revoke"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}