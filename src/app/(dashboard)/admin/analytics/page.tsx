import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsPage } from "@/features/admin/analytics/analytics-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Analytics"
            description="Aggregate trip volume, route activity, and arrival performance across the system."
          />

          <AnalyticsPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
