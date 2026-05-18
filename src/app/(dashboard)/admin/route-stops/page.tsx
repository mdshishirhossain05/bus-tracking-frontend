import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminRouteStopsPage } from "@/features/admin/route-stops/admin-route-stops-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Route Stops Assignment"
            description="Assign and order route stops for operational planning, passenger-facing visibility, and schedule alignment."
          />

          <AdminRouteStopsPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}