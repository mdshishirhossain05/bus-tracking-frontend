import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminStopsPage } from "@/features/admin/stops/admin-stops-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            title="Stops Management"
            description="Manage stops used across routes and live tracking."
          />

          <AdminStopsPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}