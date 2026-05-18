import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AdminOperationsShell } from "@/features/admin/components/admin-operations-shell";

export default function AdminOperationsPage() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin Operations Center"
            badgeTone="info"
            title="Admin Live Operations Dashboard"
            description="Monitor active trips, freshness, ETA visibility, live vehicle movement, and operational events from a production-style admin control surface."
          />

          <AdminOperationsShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}