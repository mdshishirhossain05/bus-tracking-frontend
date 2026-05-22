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
export * from "./lib/auth/AuthContext";
export * from "./lib/auth/auth.api";
export * from "./lib/auth/tokenStore";
export * from "./lib/socket/socketClient";
export * from "./lib/socket/socketEvents";
export * from "./ui/Text";
export * from "./ui/GlassSurface";
