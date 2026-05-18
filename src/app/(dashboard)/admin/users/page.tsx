import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminUsersPage } from "@/features/admin/users/admin-users-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="User Management"
            description="Manage internal operational accounts for admins and drivers, and monitor registered passengers across the system."
          />

          <AdminUsersPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}