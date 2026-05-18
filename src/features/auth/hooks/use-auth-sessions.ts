"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthSessionItem } from "../api/auth.sessions.api";
import {
  getMySessions,
  logoutAllSessions,
  logoutOtherSessions,
  revokeSession,
} from "../api/auth.sessions.api";

export function useAuthSessions() {
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMySessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const active = sessions.filter((s) => s.active).length;
    const revoked = sessions.filter((s) => !s.active).length;
    const current = sessions.find((s) => s.isCurrent) ?? null;

    return {
      total: sessions.length,
      active,
      revoked,
      current,
    };
  }, [sessions]);

  return {
    sessions,
    summary,
    loading,
    reload: load,
    logoutAll: logoutAllSessions,
    logoutOthers: logoutOtherSessions,
    revokeSession,
  };
}
