import {
  Activity,
  Clock3,
  Eye,
  RadioTower,
  Satellite,
  Smartphone,
  TriangleAlert,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface AdminKpiGridProps {
  activeTripsCount: number;
  staleTripsCount: number;
  connectedTripsCount: number;
  gpsSelectedTrips: number;
  driverSelectedTrips: number;
  averageEta: number | null;
  onlineUsers: number;
  liveWatchers: number;
}

export function AdminKpiGrid({
  activeTripsCount,
  staleTripsCount,
  connectedTripsCount,
  gpsSelectedTrips,
  driverSelectedTrips,
  averageEta,
  onlineUsers,
  liveWatchers,
}: AdminKpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Online Users"
        value={onlineUsers}
        helper="Users connected to the realtime system"
        tone={onlineUsers > 0 ? "success" : "neutral"}
        trendLabel="Live"
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        label="Live Watchers"
        value={liveWatchers}
        helper="Users currently tracking a live trip"
        tone={liveWatchers > 0 ? "info" : "neutral"}
        trendLabel="Tracking"
        icon={<Eye className="h-5 w-5" />}
      />
      <StatCard
        label="Active Trips"
        value={activeTripsCount}
        helper="Currently visible live trips"
        tone="info"
        trendLabel="Live"
        icon={<Activity className="h-5 w-5" />}
      />
      <StatCard
        label="Connected Trips"
        value={connectedTripsCount}
        helper="Trips with available live packets"
        tone="success"
        trendLabel="Streaming"
        icon={<RadioTower className="h-5 w-5" />}
      />
      <StatCard
        label="GPS Selected"
        value={gpsSelectedTrips}
        helper="Trips currently using fixed GPS"
        tone="info"
        trendLabel="Device priority"
        icon={<Satellite className="h-5 w-5" />}
      />
      <StatCard
        label="Driver Selected"
        value={driverSelectedTrips}
        helper="Trips currently using driver mobile"
        tone="neutral"
        trendLabel="Fallback/primary"
        icon={<Smartphone className="h-5 w-5" />}
      />
      <StatCard
        label="Stale Trips"
        value={staleTripsCount}
        helper="Trips requiring freshness attention"
        tone={staleTripsCount > 0 ? "warning" : "success"}
        trendLabel={staleTripsCount > 0 ? "Attention" : "Healthy"}
        icon={<TriangleAlert className="h-5 w-5" />}
      />
      <StatCard
        label="Average ETA"
        value={averageEta != null ? `${averageEta} min` : "N/A"}
        helper="Snapshot across visible trips"
        tone="neutral"
        icon={<Clock3 className="h-5 w-5" />}
      />
    </div>
  );
}
