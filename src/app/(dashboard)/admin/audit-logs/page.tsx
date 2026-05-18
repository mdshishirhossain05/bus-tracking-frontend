import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { AuditLogsPage } from "@/features/admin/audit-logs/audit-logs-page";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Admin"
            badgeTone="info"
            title="Audit Log"
            description="A chronological, filterable record of security- and operations-relevant actions across the system."
          />

          <AuditLogsPage />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
