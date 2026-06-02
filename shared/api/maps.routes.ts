export const MAPS_ROUTES = {
  base: "/v1/maps",
  locationSearch: () => "/v1/maps/location-search",
} as const;

export const MAPS_ROUTE_PATTERNS = {
  locationSearch: "/location-search",
} as const;
