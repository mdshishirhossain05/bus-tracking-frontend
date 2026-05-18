export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  passenger: {
    activeTrips: "/passenger/trips/active",
    liveTripState: (tripId: string) => `/passenger/trips/${tripId}/live`,
    tripEta: (tripId: string) => `/passenger/trips/${tripId}/eta`,
    liveBusesByRoute: (routeId: string) =>
      `/passenger/routes/${routeId}/live-buses`,
  },
  driver: {
    currentTrip: "/driver/trips/current",
    startTrip: "/driver/trips/start",
    sendLocation: (tripId: string) => `/driver/trips/${tripId}/location`,
    endTrip: (tripId: string) => `/driver/trips/${tripId}/end`,
  },
  admin: {
    operationsOverview: "/admin/operations/overview",
    operationsEvents: "/admin/operations/events",
    operationsActiveTrips: "/admin/operations/active-trips",
    tripSourceDiagnostics: (tripId: string) =>
      `/admin/operations/trips/${tripId}/sources`,
    tripOperationsDetail: (tripId: string) =>
      `/admin/operations/trips/${tripId}`,
    forceEndTrip: (tripId: string) =>
      `/admin/operations/trips/${tripId}/force-end`,
    forceRecoverTrip: (tripId: string) =>
      `/admin/operations/trips/${tripId}/force-recover`,
    gpsDevices: "/admin/gps-devices",
    gpsDeviceById: (gpsDeviceId: string) => `/admin/gps-devices/${gpsDeviceId}`,
    gpsDeviceAssignmentByBus: (busId: string) =>
      `/admin/buses/${busId}/gps-device`,
    assignGpsDeviceToBus: (busId: string) =>
      `/admin/buses/${busId}/gps-device/assign`,
    unassignGpsDeviceFromBus: (busId: string) =>
      `/admin/buses/${busId}/gps-device/unassign`,
  },
  routes: {
    presentation: (routeId: string) => `/routes/${routeId}/presentation`,
  },
};
