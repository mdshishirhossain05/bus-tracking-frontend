import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminServiceSchedulesPage } from "@/features/admin/service-schedules/admin-service-schedules-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Service Schedules"
            description="Create operational schedules by exact day of week after driver, bus, route, and route-stop setup are complete."
          />

          <AdminServiceSchedulesPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}