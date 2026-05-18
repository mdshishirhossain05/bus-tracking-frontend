"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getMe,
  logout as logoutRequest,
  refresh as refreshRequest,
  updateMe as updateMeRequest,
} from "@/features/auth/api/auth.api";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/axios";
import type { AuthUser, UserRole } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  forceLogoutForExpiredSession: () => void;
  updateProfile: (payload: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  }) => Promise<AuthUser | null>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionExpiredHandledRef = useRef(false);

  const forceLogoutForExpiredSession = useCallback(() => {
    setUser(null);
    setIsLoading(false);

    if (typeof window !== "undefined") {
      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      const next = encodeURIComponent(currentPath || "/");
      router.replace(`/login?next=${next}&reason=session-expired`);
      return;
    }

    const next = encodeURIComponent(pathname || "/");
    router.replace(`/login?next=${next}&reason=session-expired`);
  }, [pathname, router]);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const me = await getMe();
      setUser(me);
      sessionExpiredHandledRef.current = false;
      return;
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401) {
        try {
          await refreshRequest();
          const me = await getMe();
          setUser(me);
          sessionExpiredHandledRef.current = false;
          return;
        } catch (refreshError) {
          console.error("Session bootstrap failed after refresh:", refreshError);
        }
      } else {
        console.error("Session bootstrap failed:", error);
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setIsLoading(false);
      sessionExpiredHandledRef.current = false;
    }
  }, []);

  const updateProfile = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phoneNumber?: string;
    }) => {
      const updated = await updateMeRequest(payload);
      setUser(updated);
      return updated;
    },
    [],
  );

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function onSessionExpired() {
      if (sessionExpiredHandledRef.current) return;
      sessionExpiredHandledRef.current = true;
      forceLogoutForExpiredSession();
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [forceLogoutForExpiredSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      refreshSession,
      logout,
      forceLogoutForExpiredSession,
      updateProfile,
      hasRole: (...roles: UserRole[]) => {
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    [
      forceLogoutForExpiredSession,
      isLoading,
      logout,
      refreshSession,
      updateProfile,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}