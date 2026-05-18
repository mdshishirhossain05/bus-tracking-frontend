import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url(),
  NEXT_PUBLIC_MAP_DEFAULT_LAT: z.coerce.number(),
  NEXT_PUBLIC_MAP_DEFAULT_LNG: z.coerce.number(),
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: z.coerce.number(),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional().default(""),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_MAP_DEFAULT_LAT: process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT,
  NEXT_PUBLIC_MAP_DEFAULT_LNG: process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG,
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
});
