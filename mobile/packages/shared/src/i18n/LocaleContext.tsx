import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { LOCALES, type Locale } from "./locale";
import { STRINGS, type StringKey } from "./strings";

const STORAGE_KEY = "ubts.locale";

type Vars = Record<string, string | number>;

type LocaleValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /**
   * Translate a string key with optional `{name}` interpolation.
   * Missing keys fall back to the key itself so the app never crashes
   * on a stale reference — but TypeScript catches them at the call site.
   */
  t: (key: StringKey, vars?: Vars) => string;
};

const LocaleContext = createContext<LocaleValue | undefined>(undefined);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`,
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored && (LOCALES as readonly string[]).includes(stored)) {
          setLocaleState(stored as Locale);
        }
      } catch {
        // SecureStore failures are non-fatal — we just stay on the default.
      }
    })();
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const t = useCallback(
    (key: StringKey, vars?: Vars) => {
      const entry = STRINGS[key];
      if (!entry) return key;
      const template = entry[locale] ?? entry.en ?? key;
      return interpolate(template, vars);
    },
    [locale],
  );

  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside a LocaleProvider");
  }
  return ctx;
}

/** Convenience hook for components that only need `t()`. */
export function useT(): LocaleValue["t"] {
  return useI18n().t;
}
