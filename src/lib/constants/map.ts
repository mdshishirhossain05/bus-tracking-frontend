import { env } from "@/lib/config/env";

export const DEFAULT_MAP_CENTER: [number, number] = [
  env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
  env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
];

export const DEFAULT_MAP_ZOOM = env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM;
