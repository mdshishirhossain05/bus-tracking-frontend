function normalizeAuthMessage(error: any): string | null {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  const message = error?.response?.data?.message;

  if (status !== 401) {
    return null;
  }

  const authCodes = new Set([
    "UNAUTHORIZED",
    "INVALID_OR_EXPIRED_TOKEN",
    "INVALID_REFRESH",
    "INVALID_REFRESH_TYPE",
    "NO_REFRESH_TOKEN",
    "SESSION_NOT_FOUND",
    "SESSION_REVOKED",
    "SESSION_USER_MISMATCH",
    "USER_INACTIVE",
    "REFRESH_REUSE_DETECTED",
    "UNKNOWN_REFRESH_ERROR",
  ]);

  if (authCodes.has(code)) {
    return "Your session has expired. Please sign in again.";
  }

  if (
    typeof message === "string" &&
    [
      "Unauthorized",
      "Invalid or expired token",
      "Refresh failed",
      "Session revoked",
      "Session not found",
      "User inactive",
    ].includes(message)
  ) {
    return "Your session has expired. Please sign in again.";
  }

  return null;
}

/**
 * Axios surfaces machine-style strings ("Network Error", "Request failed with
 * status code 500", "timeout of …") that should never reach end users.
 */
function isMachineMessage(message: unknown): boolean {
  if (typeof message !== "string" || !message.trim()) return true;
  return (
    /^request failed with status code/i.test(message) ||
    /^network error$/i.test(message) ||
    /^timeout of /i.test(message) ||
    /^xhr/i.test(message) ||
    message.toUpperCase() === message.replace(/[^A-Z_]/g, "") // ALL_CAPS code
  );
}

function humanizeByStatus(status: number | undefined, fallback: string) {
  switch (status) {
    case 0:
    case undefined:
      return "Unable to reach the server. Please check your internet connection and try again.";
    case 400:
      return "Some of the submitted information is invalid. Please review and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested item could not be found. It may have been removed.";
    case 409:
      return "This action conflicts with the current state of the data.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "The server ran into a problem. Please try again shortly.";
    default:
      return fallback;
  }
}

export function getApiErrorMessage(
  error: any,
  fallback = "Something went wrong. Please try again.",
) {
  const authMessage = normalizeAuthMessage(error);
  if (authMessage) {
    return authMessage;
  }

  // A backend-provided message is trusted as already human-readable, unless
  // it looks like a raw error code.
  const backendMessage =
    error?.response?.data?.message || error?.response?.data?.error;
  if (typeof backendMessage === "string" && !isMachineMessage(backendMessage)) {
    return backendMessage;
  }

  const status = error?.response?.status;
  if (typeof status === "number") {
    return humanizeByStatus(status, fallback);
  }

  // No response at all — almost always a network/connectivity failure.
  if (error?.request || /network/i.test(String(error?.message ?? ""))) {
    return "Unable to reach the server. Please check your internet connection and try again.";
  }

  const rawMessage = error?.message;
  if (typeof rawMessage === "string" && !isMachineMessage(rawMessage)) {
    return rawMessage;
  }

  return fallback;
}

export function getApiStatusCode(error: any): number | null {
  const status = error?.response?.status;
  return typeof status === "number" ? status : null;
}
