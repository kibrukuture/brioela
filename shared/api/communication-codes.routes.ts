export const COMMUNICATION_CODE_ROUTES = {
  base: "/v1/communication-code",
  update: () => "/v1/communication-code",
  get: () => "/v1/communication-code",
} as const;

export const COMMUNICATION_CODE_ROUTE_PATTERNS = {
  update: "/",
  get: "/",
} as const;
