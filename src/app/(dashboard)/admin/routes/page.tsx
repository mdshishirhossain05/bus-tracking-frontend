import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminRoutesPage } from "@/features/admin/routes/admin-routes-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Routes Management"
            description="Manage route definitions used for stop assignment, operational scheduling, and passenger-facing route visibility."
          />

          <AdminRoutesPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}