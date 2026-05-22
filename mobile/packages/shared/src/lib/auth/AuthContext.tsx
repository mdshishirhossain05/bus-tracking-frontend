import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser } from "../../types";
import { fetchMe, login as loginApi, logout as logoutApi } from "./auth.api";
import { hydrateTokens, onTokensCleared } from "./tokenStore";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;

    (async () => {
      const hasToken = await hydrateTokens();
      if (!active) return;

      if (!hasToken) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const me = await fetchMe();
        if (!active) return;
        setUser(me);
        setStatus(me ? "authenticated" : "unauthenticated");
      } catch {
        if (active) setStatus("unauthenticated");
      }
    })();

    // Triggered when a refresh fails and tokens are wiped mid-session.
    const unsubscribe = onTokensCleared(() => {
      setUser(null);
      setStatus("unauthenticated");
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await loginApi(email, password);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut }),
    [user, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
