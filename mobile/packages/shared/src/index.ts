/**
 * Public surface of the shared layer consumed by both the passenger and
 * driver apps: design tokens, types, the realtime/socket client, the HTTP
 * client, auth, and the cross-app UI primitives.
 */
export * from "./theme/tokens";
export * from "./types";
export * from "./config/env";
export * from "./constants/mapStyleDark";
export * from "./lib/geo";
export * from "./lib/api/client";
export * from "./lib/api/endpoints";
export * from "./lib/api/profile.api";
export * from "./lib/api/sessions.api";
export * from "./lib/api/notifications.api";
export * from "./lib/api/companion.api";
export * from "./i18n/locale";
export * from "./i18n/strings";
export * from "./i18n/format";
export * from "./i18n/LocaleContext";
export * from "./a11y/useReduceMotion";
export * from "./lib/auth/AuthContext";
export * from "./lib/auth/auth.api";
export * from "./lib/auth/register.api";
export * from "./lib/auth/forgotPassword.api";
export * from "./lib/auth/tokenStore";
export * from "./constants/academics";
export * from "./lib/notifications/NotificationsContext";
export * from "./lib/socket/socketClient";
export * from "./lib/socket/socketEvents";
export * from "./ui/Text";
export * from "./ui/GlassSurface";
export * from "./ui/Icon";
export * from "./ui/IconButton";
export * from "./ui/Button";
export * from "./ui/Badge";
export * from "./ui/Row";
export * from "./ui/ScreenHeader";
export * from "./ui/EmptyState";
export * from "./ui/Skeleton";
export * from "./ui/StatusBadge";
