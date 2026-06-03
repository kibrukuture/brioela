export const QUERY_KEYS = {
  USER: {
    CURRENT: ['user', 'current'], // Current logged-in user
    BY_ID: (id: string) => ['user', id], // User by ID (if needed)
    CHECK_SCHNL_TAG: (tag: string) => ['user', 'check-tag', tag],
    SEARCH: (query: string) => ['user', 'search', query],
  },
  BANKING: {
    KYC_LINK: ['banking', 'kyc-link'],
    CUSTOMER_ADDRESS: ['banking', 'customer-address'],
    LIMITS: ['banking', 'limits'],
    ACCOUNTS: ['banking', 'accounts'],
    EMBEDDED_WALLET: ['banking', 'embedded-wallet'],
    SESSION_STATUS: ['banking', 'session-status'],
    BALANCES: ['banking', 'balances'],
    FX_RATE: (params: { from: string; to: string }) => ['banking', 'fx-rate', params],
    PAY_REQUEST: (id: string) => ['banking', 'pay-request', id],
    RECIPIENTS: ['banking', 'recipients'],
    RECIPIENT_BY_ID: (id: string) => ['banking', 'recipients', id],
    TRANSACTIONS_BASE: ['banking', 'transactions'],
    TRANSACTIONS: (params?: { limit?: number; cursor?: string }) => [
      'banking',
      'transactions',
      params ?? {},
    ],
  },
  MEDICATIONS: {
    LIST: ['medications'], // All medications
    BY_ID: (id: number) => ['medications', id], // Single medication
  },
  LAB_RESULTS: {
    LIST: ['lab-results'], // All lab results
    BY_ID: (id: number) => ['lab-results', id], // Single lab result
  },
  SEARCH: {
    BY_QUERY: (query: string, filters?: { types?: string[] }) => ['search', query, filters], // Search results
  },
  MAPS: {
    LOCATION_SEARCH: (params: { query: string; countryCodes?: string[] }) => [
      'maps',
      'location-search',
      params,
    ],
  },
  CARD_CONTROLS: {
    BY_CARD_ID: (cardId: string) => ['card-controls', cardId],
  },
  CARDS: {
    LIST: ['cards', 'list'],
    ORDER_BY_ID: (orderId: string) => ['cards', 'orders', orderId],
    SPENDING_LIMITS: (cardId: string) => ['cards', 'spending-limits', cardId],
  },
  COMMUNICATION_CODE: {
    CURRENT: ['communication-code', 'current'],
  },
  IN_APP_NOTIFICATIONS: {
    LIST: ['in-app-notifications', 'list'],
  },
} as const;
