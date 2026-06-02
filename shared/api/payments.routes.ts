export const PAYMENTS_ROUTES = {
  base: "/v1/payments",

  // stripe
  "stripe.create-billing-portal-session":
    "/v1/payments/stripe/create-billing-portal-session",
  "stripe.create-topup-intent": "/v1/payments/stripe/create-topup-intent",
  "stripe.webhook": "/v1/payments/stripe/webhook",

  // superwall
  "superwall.webhook": "/v1/payments/superwall/webhook",
} as const;

// ✅ Define patterns (for API router)
export const PAYMENTS_ROUTE_PATTERNS = {
  // stripe
  "stripe.base": "/stripe",
  "stripe.webhook": "/webhook",
  "stripe.create-billing-portal-session": "/create-billing-portal-session",
  "stripe.create-topup-intent": "/create-topup-intent",

  // superwall
  "superwall.webhook": "/webhook",
  "superwall.base": "/superwall",
} as const;
