import { BusFront } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { DriverTripShell } from "@/features/driver/components/driver-trip-shell";

export default function DriverTripsPage() {
  return (
    <AuthGuard allowedRoles={["DRIVER"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            icon={<BusFront className="h-6 w-6" />}
            badge="Driver console"
            badgeTone="info"
            title="Your trip"
            description="Start and end your assigned trip, share live location, and follow your route stop by stop."
          />

          <DriverTripShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}
