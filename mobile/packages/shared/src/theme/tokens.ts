/**
 * Design tokens carried over from the web app's `globals.css` so the native
 * apps share one visual identity: a near-black navy canvas, slate type, a
 * single blue accent, frosted-glass surfaces, and quiet motion.
 */
export const colors = {
  background: "#0a0e16",
  backgroundElevated: "#111722",
  muted: "#1a2230",
  foreground: "#e2e8f0",
  mutedForeground: "#94a3b8",
  faintForeground: "#64748b",

  border: "rgba(148, 163, 184, 0.12)",
  borderStrong: "rgba(148, 163, 184, 0.22)",

  primary: "#3b82f6",
  primaryActive: "#2563eb",
  primaryForeground: "#ffffff",
  primarySoft: "rgba(59, 130, 246, 0.16)",

  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",

  ring: "rgba(59, 130, 246, 0.35)",
  glass: "rgba(17, 23, 34, 0.82)",
  glassBorder: "rgba(148, 163, 184, 0.16)",
  scrim: "rgba(5, 8, 13, 0.6)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Inter family names registered in `App.tsx` via `useFonts`. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  display: 40,
} as const;

/** Quiet, springy motion — the web app's 0.24s ease-out, elevated. */
export const motion = {
  fast: 180,
  base: 240,
  slow: 360,
  spring: { damping: 18, stiffness: 160, mass: 0.9 },
} as const;

export const elevation = {
  panel: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  fontSize,
  motion,
  elevation,
} as const;

export type Theme = typeof theme;
