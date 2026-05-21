import { LayoutDashboard } from "lucide-react";
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
            icon={<LayoutDashboard className="h-6 w-6" />}
            badge="Operations"
            badgeTone="info"
            title="Live operations"
            description="Track every active trip in real time — fleet health, ETAs, live vehicle positions, and operational events at a glance."
          />

          <AdminOperationsShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
