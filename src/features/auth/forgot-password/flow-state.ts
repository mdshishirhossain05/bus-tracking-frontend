// Transient client-side state for the multi-page password-reset flow.
// The verificationToken here is a short-lived, single-use reset token — NOT
// an authentication token — and is cleared as soon as the reset completes.
// BROWSER-ONLY: backed by sessionStorage.

const STORAGE_KEY = "ubt.forgot-password.flow";

export interface ForgotPasswordFlowState {
  email: string;
  verificationToken?: string;
}

export function saveForgotPasswordFlow(state: ForgotPasswordFlowState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable (private mode / SSR) — flow falls back to
    // query params; nothing to do here.
  }
}

export function readForgotPasswordFlow(): ForgotPasswordFlowState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ForgotPasswordFlowState;
    return typeof parsed?.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearForgotPasswordFlow(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
