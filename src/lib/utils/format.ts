import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "N/A";

  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return format(date, "dd MMM yyyy, hh:mm a");
  } catch {
    return "Invalid date";
  }
}

export function formatRelativeTime(value?: string | Date | null) {
  if (!value) return "N/A";

  try {
    const date = typeof value === "string" ? parseISO(value) : value;
    return `${formatDistanceToNowStrict(date)} ago`;
  } catch {
    return "Invalid time";
  }
}

export function formatCoordinate(value?: number | null) {
  if (typeof value !== "number") return "N/A";
  return value.toFixed(6);
}

export function formatSpeed(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(1)} km/h`;
}
