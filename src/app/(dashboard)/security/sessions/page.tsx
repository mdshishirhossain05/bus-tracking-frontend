import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { MySessionsPage } from "@/features/auth/my-sessions-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN", "DRIVER", "PASSENGER"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Security"
            badgeTone="info"
            title="My Sessions"
            description="Inspect your device sessions, revoke sessions you do not trust, and secure your account."
          />

          <MySessionsPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}