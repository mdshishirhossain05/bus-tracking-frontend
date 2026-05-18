import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MapPinned,
  BusFront,
  ShieldCheck,
  Map,
  MapPin,
  Route,
  Calendar,
  Users,
  Shield,
  Warehouse,
  UserCircle2,
  Satellite,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  roles: UserRole[];
}

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "System landing and high-level entry points",
    roles: ["ADMIN", "DRIVER", "PASSENGER"],
  },
  {
    label: "Passenger Live",
    href: "/passenger/live",
    icon: MapPinned,
    description: "Realtime bus tracking for passengers",
    roles: ["ADMIN", "PASSENGER"],
  },
  {
    label: "Driver Trips",
    href: "/driver/trips",
    icon: BusFront,
    description: "Driver trip control and GPS publishing",
    roles: ["ADMIN", "DRIVER"],
  },
  {
    label: "Account",
    href: "/account",
    icon: UserCircle2,
    description: "Profile, password, and signed-in session management",
    roles: ["ADMIN", "DRIVER", "PASSENGER"],
  },
  {
    label: "Admin Operations",
    href: "/admin/operations",
    icon: ShieldCheck,
    description: "Operations monitoring and route health",
    roles: ["ADMIN"],
  },
  {
    label: "Stops",
    href: "/admin/stops",
    icon: MapPin,
    description: "Manage physical bus stops used in routes",
    roles: ["ADMIN"],
  },
  {
    label: "Routes",
    href: "/admin/routes",
    icon: Map,
    description: "Define and manage route structures",
    roles: ["ADMIN"],
  },
  {
    label: "Route Stops",
    href: "/admin/route-stops",
    icon: Route,
    description: "Assign and order stops for each route",
    roles: ["ADMIN"],
  },
  {
    label: "Buses",
    href: "/admin/buses",
    icon: Warehouse,
    description: "Manage bus inventory and operational vehicles",
    roles: ["ADMIN"],
  },
  {
    label: "GPS Devices",
    href: "/admin/gps-devices",
    icon: Satellite,
    description: "Manage fixed GPS devices and bus assignment",
    roles: ["ADMIN"],
  },
  {
    label: "Service Schedules",
    href: "/admin/service-schedules",
    icon: Calendar,
    description: "Manage operational schedules",
    roles: ["ADMIN"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage system users",
    roles: ["ADMIN"],
  },
  {
    label: "My Sessions",
    href: "/security/sessions",
    icon: Shield,
    description: "Review and secure your signed-in devices",
    roles: ["ADMIN", "DRIVER", "PASSENGER"],
  },
];
