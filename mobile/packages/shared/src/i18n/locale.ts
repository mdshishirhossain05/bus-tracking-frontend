/**
 * Lightweight i18n for the mobile apps. Two locales (English + Bengali);
 * strings live in `strings.ts`; the active locale is persisted in
 * SecureStore and exposed via `useI18n()` / `useT()`.
 *
 * We deliberately don't pull in i18next or the like — the surface is
 * small enough that a typed string map is cheaper to maintain and
 * crashes loudly at compile time if a key is missing.
 */

export const LOCALES = ["en", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, { native: string; english: string }> =
  {
    en: { native: "English", english: "English" },
    bn: { native: "বাংলা", english: "Bengali" },
  };
