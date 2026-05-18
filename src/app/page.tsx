import Link from "next/link";
import {
  Activity,
  BusFront,
  MapPinned,
  ShieldCheck,
  ArrowRight,
  UserCircle2,
  Radio,
  Shield,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ContentWrap } from "@/components/layout/content-wrap";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <AuthGuard allowedRoles={["ADMIN", "DRIVER", "PASSENGER"]}>
      <AppShell>
        <ContentWrap className="space-y-6">
          <PageHeader
            badge="Submission-ready system"
            badgeTone="success"
            title="University Bus Tracking System"
            description="Role-aware operations, realtime bus movement, driver trip control, passenger live tracking, and administrative management are now organized into a single production-style web platform."
            action={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link href="/account">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <UserCircle2 className="h-4 w-4" />
                    My Account
                  </Button>
                </Link>
                <Link href="/passenger/live">
                  <Button className="w-full sm:w-auto">
                    <ArrowRight className="h-4 w-4" />
                    Open live tracking
                  </Button>
                </Link>
              </div>
            }
          />

          <PageSection title="Operational snapshot">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Realtime tracking"
                value="Active"
                helper="Passenger and admin views support live map updates"
                tone="success"
                trendLabel="Live"
                icon={<Radio className="h-5 w-5" />}
              />
              <StatCard
                label="Passenger module"
                value="Ready"
                helper="Route-aware passenger live tracking is available"
                tone="info"
                trendLabel="Tracking"
                icon={<MapPinned className="h-5 w-5" />}
              />
              <StatCard
                label="Driver operations"
                value="Ready"
                helper="Trip lifecycle and smart location publishing are available"
                tone="warning"
                trendLabel="Operational"
                icon={<BusFront className="h-5 w-5" />}
              />
              <StatCard
                label="Admin management"
                value="Ready"
                helper="Operations monitoring and user management are available"
                tone="warning"
                trendLabel="Managed"
                icon={<ShieldCheck className="h-5 w-5" />}
              />
            </div>
          </PageSection>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <PageSection title="Quick entry points">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Passenger Live</CardTitle>
                    <CardDescription>
                      Track active bus movement, ETA, and route context from the passenger view.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/passenger/live">
                      <Button className="w-full justify-center">
                        Open passenger tracking
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Driver Trips</CardTitle>
                    <CardDescription>
                      Control trip start and end, GPS permission, and live location publishing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/driver/trips">
                      <Button className="w-full justify-center">
                        Open driver console
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Admin Operations</CardTitle>
                    <CardDescription>
                      Monitor live operational state and route-level movement from the admin map.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/operations">
                      <Button className="w-full justify-center">
                        Open admin operations
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account & Security</CardTitle>
                    <CardDescription>
                      Update profile details, change password, and manage signed-in sessions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/account">
                      <Button variant="secondary" className="w-full justify-center">
                        Open account center
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </PageSection>

            <PageSection title="System readiness">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current completed scope</CardTitle>
                    <CardDescription>
                      The system now supports core submission-ready operational flows.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-slate-400">
                    <p>Role-aware authentication and protected navigation</p>
                    <p>Passenger live tracking with map, ETA, and trip context</p>
                    <p>Driver trip control with smart web-based live publishing</p>
                    <p>Admin operations, user management, and session visibility</p>
                    <p>Responsive mobile-first web UX for major workflows</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Production next phase</CardTitle>
                    <CardDescription>
                      Future scope for true native-grade location behavior beyond the web client.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-slate-400">
                    <div className="flex items-start gap-3">
                      <Activity className="mt-0.5 h-4.5 w-4.5 text-slate-500" />
                      <p>Native mobile driver app for background GPS tracking</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-4.5 w-4.5 text-slate-500" />
                      <p>Stronger operational alerting and deeper notification workflows</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPinned className="mt-0.5 h-4.5 w-4.5 text-slate-500" />
                      <p>Higher fidelity movement smoothing and map intelligence</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PageSection>
          </div>
        </ContentWrap>
      </AppShell>
    </AuthGuard>
  );
}