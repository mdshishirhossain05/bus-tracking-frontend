import { Radar } from "lucide-react";
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
            icon={<Radar className="h-6 w-6" />}
            badge="Live tracking"
            badgeTone="info"
            title="Track your bus"
            description="Follow active university buses on the map in real time, with live ETAs to your nearest stop and stop-by-stop progress."
          />

          <PassengerLiveShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
