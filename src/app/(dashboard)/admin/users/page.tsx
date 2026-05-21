import { Users } from "lucide-react";
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
            icon={<Users className="h-6 w-6" />}
            badge="Admin"
            badgeTone="info"
            title="User management"
            description="Manage admin, driver, and passenger accounts, and review passengers awaiting approval."
          />

          <AdminUsersPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
