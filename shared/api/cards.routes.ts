export const CARDS_ROUTES = {
  base: "/v1/cards",
  list: () => "/v1/cards",
  createOrder: () => "/v1/cards/orders",
  orderById: (orderId: string) => `/v1/cards/orders/${orderId}`,
  cardById: (cardId: string) => `/v1/cards/${cardId}`,
  freeze: (cardId: string) => `/v1/cards/${cardId}/freeze`,
  unfreeze: (cardId: string) => `/v1/cards/${cardId}/unfreeze`,
  cancel: (cardId: string) => `/v1/cards/${cardId}/cancel`,
  label: (cardId: string) => `/v1/cards/${cardId}/label`,
  spendingLimits: (cardId: string) => `/v1/cards/${cardId}/spending-limits`,
  appleWalletProvisioning: (cardId: string) =>
    `/v1/cards/${cardId}/wallet/apple/provisioning`,
  googlePayProvisioning: (cardId: string) =>
    `/v1/cards/${cardId}/wallet/google/provisioning`,
  replace: (cardId: string) => `/v1/cards/${cardId}/replace`,
} as const;

export const CARDS_ROUTE_PATTERNS = {
  base: "/",
  list: "/",
  createOrder: "/orders",
  orderById: "/orders/:orderId",
  cardById: "/:cardId",
  freeze: "/:cardId/freeze",
  unfreeze: "/:cardId/unfreeze",
  cancel: "/:cardId/cancel",
  label: "/:cardId/label",
  spendingLimits: "/:cardId/spending-limits",
  appleWalletProvisioning: "/:cardId/wallet/apple/provisioning",
  googlePayProvisioning: "/:cardId/wallet/google/provisioning",
  replace: "/:cardId/replace",
} as const;
