/** Mirrors the web client's endpoint map so both clients hit the same API. */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  passenger: {
    activeTrips: "/passenger/trips/active",
    liveTripState: (tripId: string) => `/passenger/trips/${tripId}/live`,
    tripEta: (tripId: string) => `/passenger/trips/${tripId}/eta`,
  },
  routes: {
    presentation: (routeId: string) => `/routes/${routeId}/presentation`,
  },
} as const;
