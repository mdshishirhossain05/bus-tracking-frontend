import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminGpsDevicesPage } from "@/features/admin/gps-devices/admin-gps-devices-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Fixed GPS Devices"
            description="Manage hardware GPS units, active bus assignment, and fixed-source live tracking readiness."
          />

          <AdminGpsDevicesPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}