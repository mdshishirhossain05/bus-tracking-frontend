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
            badge="Driver Operations"
            badgeTone="info"
            title="Driver Trip Control"
            description="Control trip lifecycle, publish live GPS data, monitor send health, and operate within a production-style driver console."
          />

          <DriverTripShell />
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}