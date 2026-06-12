# Draft: shop.routes.ts (gap — file does not exist)

Target: `shared/routes/shop.routes.ts`

**Gap:** No route constants for shop session API.

**Source:** `brioela-specs/45-in-store-copilot.md`

---

```typescript
export const SHOP_ROUTES = {
  session: '/api/shop/session',
  sessionEvents: '/api/shop/session/events',
  sessionEnd: '/api/shop/session/end',
  visit: (visitId: string) => `/api/shop/visits/${visitId}`,
} as const

export const SHOP_ROUTE_PATTERNS = {
  session: '/api/shop/session',
  sessionEvents: '/api/shop/session/events',
  sessionEnd: '/api/shop/session/end',
  visit: '/api/shop/visits/:visitId',
} as const
```
