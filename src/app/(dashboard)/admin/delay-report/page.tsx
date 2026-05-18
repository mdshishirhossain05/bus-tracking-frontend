import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { DelayReportPage } from "@/features/admin/analytics/delay-report-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Delay Report"
            description="Scheduled-versus-actual arrival performance: on-time rate, late arrivals, and average delay across recorded stop arrivals."
          />

          <DelayReportPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
