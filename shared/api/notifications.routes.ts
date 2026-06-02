export const NOTIFICATIONS_ROUTES = {
  base: "/v1/notifications",
  "courier.mint-jwt": "/v1/notifications/courier/mint-jwt",
  "push.register": "/v1/notifications/push/register",
  "push.unregister": "/v1/notifications/push/unregister",
  "push.send": "/v1/notifications/push/send",
} as const;

export const NOTIFICATIONS_ROUTE_PATTERNS = {
  "courier.base": "/courier",
  "courier.mint-jwt": "/courier/mint-jwt",
  "push.base": "/push",
  "push.register": "/push/register",
  "push.unregister": "/push/unregister",
  "push.send": "/push/send",
} as const;
