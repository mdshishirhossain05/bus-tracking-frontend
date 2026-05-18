import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminBusesPage } from "@/features/admin/buses/admin-buses-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Buses Management"
            description="Manage bus inventory used for trip operations, route assignment, and service scheduling."
          />

          <AdminBusesPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}