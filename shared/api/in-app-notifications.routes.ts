export const IN_APP_NOTIFICATIONS_ROUTES = {
  base: "/v1/in-app-notifications",
  list: () => "/v1/in-app-notifications",
  update: (id: string) => `/v1/in-app-notifications/${id}`,
  markAllRead: () => "/v1/in-app-notifications/mark-all-read",
  ws: () => "/v1/in-app-notifications/ws",
  wsTicket: () => "/v1/in-app-notifications/ws-ticket",
} as const;

export const IN_APP_NOTIFICATIONS_ROUTE_PATTERNS = {
  list: "/",
  update: "/:id",
  markAllRead: "/mark-all-read",
  ws: "/ws",
  wsTicket: "/ws-ticket",
} as const;
