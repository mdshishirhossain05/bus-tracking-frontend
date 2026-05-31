import { z } from "zod";

/**
 * Env schema. Every NEXT_PUBLIC_* var is required at runtime but has a
 * placeholder default so the production build doesn't blow up when
 * Next.js evaluates this module during prerender / static analysis.
 *
 * On Vercel the real values come from project env config and get inlined
 * into the client bundle; the placeholders below only get used if the
 * build runs in a context where the env isn't set (CI without secrets,
 * `next build` locally without `.env.local`, etc.) and they fail loudly
 * at the first network call rather than blocking the build entirely.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000/api/v1"),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_MAP_DEFAULT_LAT: z.coerce.number().default(23.7806),
  NEXT_PUBLIC_MAP_DEFAULT_LNG: z.coerce.number().default(90.2792),
  NEXT_PUBLIC_MAP_DEFAULT_ZOOM: z.coerce.number().default(13),
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
