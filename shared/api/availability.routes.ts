export const AVAILABILITY_ROUTES = {
  base: "/v1/availability",
  checkSchnlTag: () => "/v1/availability/schnl-tag",
} as const;

export const AVAILABILITY_ROUTE_PATTERNS = {
  checkSchnlTag: "/schnl-tag",
} as const;
