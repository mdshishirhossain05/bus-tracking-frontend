import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AccountPage } from "@/features/account/account-page";

export default function DashboardAccountPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN", "DRIVER", "PASSENGER"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Account"
            badgeTone="info"
            title="Profile & Security"
            description="Update your account profile, change your password, and manage your active sessions."
          />
          <AccountPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}