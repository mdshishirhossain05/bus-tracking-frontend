import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type PassengerScreen =
  | "routes"
  | "routeDetail"
  | "todaysSchedules"
  | "notifications"
  | "notificationPreferences"
  | "history"
  | "profile";

export interface ScreenEntry {
  name: PassengerScreen;
  params?: Record<string, any>;
  key: string;
}

interface NavValue {
  stack: ScreenEntry[];
  navigate: (name: PassengerScreen, params?: Record<string, any>) => void;
  goBack: () => void;
  reset: () => void;
}

const NavContext = createContext<NavValue | undefined>(undefined);

/**
 * A minimal stack navigator. The Live map stays mounted as the base layer
 * (so the realtime connection survives), and these screens render as opaque
 * full-screen overlays pushed on top — no native nav dependency required.
 */
export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stack, setStack] = useState<ScreenEntry[]>([]);

  const navigate = useCallback(
    (name: PassengerScreen, params?: Record<string, any>) => {
      setStack((prev) => [
        ...prev,
        { name, params, key: `${name}-${Date.now()}` },
      ]);
    },
    [],
  );

  const goBack = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);
  const reset = useCallback(() => setStack([]), []);

  const value = useMemo(
    () => ({ stack, navigate, goBack, reset }),
    [stack, navigate, goBack, reset],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within a NavigationProvider");
  return ctx;
}
