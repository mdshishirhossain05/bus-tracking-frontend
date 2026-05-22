/**
 * Runtime configuration. Expo inlines any `EXPO_PUBLIC_*` variable at build
 * time, so these can be set via a local `.env` file (see `.env.example`).
 *
 * `apiBaseUrl` must include the API version prefix (e.g. `/api/v1`) to match
 * the existing backend routes the web client already consumes.
 */
function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:4000",
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  map: {
    defaultLat: num(process.env.EXPO_PUBLIC_MAP_DEFAULT_LAT, 23.8103),
    defaultLng: num(process.env.EXPO_PUBLIC_MAP_DEFAULT_LNG, 90.4125),
    defaultZoom: num(process.env.EXPO_PUBLIC_MAP_DEFAULT_ZOOM, 14),
  },
} as const;
