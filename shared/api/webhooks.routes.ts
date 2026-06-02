export const WEBHOOK_ROUTES = {
  base: "/v1/webhooks",

  "stripe.webhook": "/v1/webhooks/stripe/events",

  // align
  "align.webhook": "/v1/webhooks/align/events",

  // superwall
  "superwall.webhook": "/v1/webhooks/superwall/events",
} as const;

// ✅ Define patterns (for API router)
export const WEBHOOK_ROUTE_PATTERNS = {
  "stripe.base": "/stripe",
  "stripe.webhook": "/events",

  // align
  "align.base": "/align",
  "align.webhook": "/events",

  // superwall
  "superwall.base": "/superwall",
  "superwall.webhook": "/events",
} as const;

// export const WEBHOOK_ROUTE_PATTERNS = {
//   // stripe
//   "stripe.provider": "/stripe",
//   "stripe.events": "/events",

//   // align
//   "align.provider": "/align",
//   "align.events": "/events",

//   // superwall
//   "superwall.provider": "/superwall",
//   "superwall.events": "/events",
// } as const;
