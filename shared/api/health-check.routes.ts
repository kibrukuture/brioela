export const HEALTH_CHECK_ROUTES = {
  base: "/v1/health",

  check: () => "/v1/health", // this is the actual health check endpoint
} as const;
