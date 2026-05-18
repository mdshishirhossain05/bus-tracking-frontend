import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { PassengerLiveShell } from "@/features/passenger/components/passenger-live-shell";

export default function PassengerLivePage() {
  return (
    <AuthGuard allowedRoles={["ADMIN", "PASSENGER"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Passenger Realtime Tracking"
            badgeTone="info"
            title="Passenger Live Tracking"
            description="Monitor active university buses in realtime with live trip selection, ETA visibility, location freshness, and operational-grade map tracking."
          />

          <PassengerLiveShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}