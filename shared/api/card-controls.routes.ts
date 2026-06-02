export const CARD_CONTROLS_ROUTES = {
  base: "/v1/card-controls",
  byCardId: (cardId: string) => `/v1/card-controls/${cardId}`,
} as const;

export const CARD_CONTROLS_ROUTE_PATTERNS = {
  base: "/",
  byCardId: "/:cardId",
} as const;
