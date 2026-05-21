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
        helper="People connected right now"
        tone={onlineUsers > 0 ? "success" : "neutral"}
        trendLabel="Live"
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        label="Live Watchers"
        value={liveWatchers}
        helper="People tracking a trip right now"
        tone={liveWatchers > 0 ? "info" : "neutral"}
        trendLabel="Tracking"
        icon={<Eye className="h-5 w-5" />}
      />
      <StatCard
        label="Active Trips"
        value={activeTripsCount}
        helper="Trips currently running"
        tone="info"
        trendLabel="Live"
        icon={<Activity className="h-5 w-5" />}
      />
      <StatCard
        label="Connected Trips"
        value={connectedTripsCount}
        helper="Trips sending live location"
        tone="success"
        trendLabel="Streaming"
        icon={<RadioTower className="h-5 w-5" />}
      />
      <StatCard
        label="GPS Device"
        value={gpsSelectedTrips}
        helper="Tracked by a fitted GPS device"
        tone="info"
        trendLabel="Device"
        icon={<Satellite className="h-5 w-5" />}
      />
      <StatCard
        label="Driver Phone"
        value={driverSelectedTrips}
        helper="Tracked by the driver's phone"
        tone="neutral"
        trendLabel="Mobile"
        icon={<Smartphone className="h-5 w-5" />}
      />
      <StatCard
        label="Stale Trips"
        value={staleTripsCount}
        helper="Not updated recently"
        tone={staleTripsCount > 0 ? "warning" : "success"}
        trendLabel={staleTripsCount > 0 ? "Attention" : "Healthy"}
        icon={<TriangleAlert className="h-5 w-5" />}
      />
      <StatCard
        label="Average ETA"
        value={averageEta != null ? `${averageEta} min` : "N/A"}
        helper="Across all active trips"
        tone="neutral"
        icon={<Clock3 className="h-5 w-5" />}
      />
    </div>
  );
}
