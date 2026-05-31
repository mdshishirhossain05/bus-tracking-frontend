/**
 * Every page under (dashboard) is auth-gated by `AuthGuard`. There's
 * nothing meaningful to prerender — the data comes from the API once a
 * real user is logged in. Marking the segment as dynamic stops Next.js
 * from trying to statically generate these routes (which would crash
 * during build because the env validator runs at module load).
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
