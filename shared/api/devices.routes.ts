export const DEVICE_ROUTES = {
  base: "/v1/devices",
  bind: "/v1/devices/bind",
  verify: "/v1/devices/verify",
  unbind: "/v1/devices/unbind",
} as const;

// Patterns for route registration (e.g., with a router)
export const DEVICE_ROUTE_PATTERNS = {
  base: "/",
  bind: "/bind",
  verify: "/verify",
  unbind: "/unbind",
} as const;
