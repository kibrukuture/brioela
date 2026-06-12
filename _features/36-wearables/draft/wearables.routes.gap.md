# Draft: wearables.routes.ts (gap — file does not exist)

Target: `shared/routes/wearables.routes.ts`

**Source:** `build-guide/20-wearables/02-client-aggregation.md`

---

```typescript
export const WEARABLES_ROUTES = {
  dailySummary: '/api/wearables/daily-summary',
  connections: '/api/wearables/connections',
  connect: '/api/wearables/connect',
  disconnect: '/api/wearables/disconnect',
  glucoseWindowReadings: '/api/wearables/glucose-window/readings',
} as const

export type WearablesRouteKey = keyof typeof WEARABLES_ROUTES
```

Mount under Hono app in `backend/src/api/wearables/wearables.route.ts` (**01** foundation).
