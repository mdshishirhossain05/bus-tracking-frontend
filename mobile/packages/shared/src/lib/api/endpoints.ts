/** Mirrors the web client's endpoint map so both clients hit the same API. */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    logout: "/auth/logout",
    logoutAll: "/auth/logout-all",
    logoutOthers: "/auth/logout-others",
    changePassword: "/auth/change-password",
    sessions: "/auth/sessions",
    session: (sessionId: string) => `/auth/sessions/${sessionId}`,
  },
  passenger: {
    activeTrips: "/passenger/trips/active",
    liveTripState: (tripId: string) => `/passenger/trips/${tripId}/live`,
    tripEta: (tripId: string) => `/passenger/trips/${tripId}/eta`,
    routeLiveBuses: (routeId: string) =>
      `/passenger/routes/${routeId}/live-buses`,
    favorites: "/passenger/favorites",
    favorite: (routeId: string) => `/passenger/favorites/${routeId}`,
  },
  routes: {
    presentation: (routeId: string) => `/routes/${routeId}/presentation`,
  },
  notifications: {
    list: "/notifications",
    readAll: "/notifications/read-all",
    read: (id: string) => `/notifications/${id}/read`,
    pushToken: "/notifications/push-token",
  },
} as const;
