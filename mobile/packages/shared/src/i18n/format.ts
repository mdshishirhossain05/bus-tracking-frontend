import type { Locale } from "./locale";

const BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

/** Replace ASCII digits in a string with their Bengali equivalents. */
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BENGALI_DIGITS[d] ?? d);
}

/** Locale-aware numeric rendering. Returns the string form ready for `<Text>`. */
export function localizeNumber(
  value: number | string | null | undefined,
  locale: Locale,
): string {
  if (value == null) return "";
  return locale === "bn" ? toBengaliDigits(value) : String(value);
}

/**
 * Format a clock-style "HH:MM" minute-of-day, localizing digits.
 * Accepts minute count (0..1439) so callers don't need their own helper.
 */
export function formatMinuteOfDay(
  minute: number | null | undefined,
  locale: Locale,
): string {
  if (minute == null) return "—";
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const raw = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return locale === "bn" ? toBengaliDigits(raw) : raw;
}
