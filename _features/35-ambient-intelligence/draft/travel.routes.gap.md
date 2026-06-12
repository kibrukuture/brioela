# Draft: travel.routes.ts (gap — file does not exist)

Target: `shared/routes/travel.routes.ts`

**Gap (feature 35):** Travel status + intent event routes per spec **22**.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`

---

```typescript
export const TRAVEL_ROUTES = {
  status: {
    method: 'GET' as const,
    path: '/api/travel/status',
  },
  intentEvent: {
    method: 'POST' as const,
    path: '/api/agent/events',
  },
  preloadWorker: {
    method: 'POST' as const,
    path: '/api/travel/preload',
  },
} as const

export type TravelStatusResponse = {
  intentId: string | null
  status: 'pending' | 'confirmed' | 'active' | 'expired' | 'dismissed' | null
  preloadComplete: boolean
  destinationCity: string | null
  geoRegion: string | null
}
```

`intentEvent` may share generic agent events router — document event type `travel.intent_detected`.
