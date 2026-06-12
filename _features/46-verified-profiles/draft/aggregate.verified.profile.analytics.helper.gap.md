# Draft: aggregate.verified.profile.analytics.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/verified/aggregate.verified.profile.analytics.helper.ts`

Source: `build-guide/23-verified-profiles/06-analytics-and-revenue.md`

Privacy-safe aggregates only — no user identity or health traits.

---

```typescript
import { z } from 'zod'

export const verifiedBusinessAnalyticsSchema = z.object({
  profileViews: z.number().int().nonnegative(),
  mapListingTaps: z.number().int().nonnegative(),
  aggregateScanCount: z.number().int().nonnegative(),
  aggregateMenuViews: z.number().int().nonnegative(),
  uncertaintyTrends: z.array(z.object({ label: z.string(), count: z.number().int() })),
})

export const verifiedPersonAnalyticsSchema = z.object({
  profileViews: z.number().int().nonnegative(),
  publicRecipeViews: z.number().int().nonnegative(),
  recipeSaves: z.number().int().nonnegative(),
  cookStarts: z.number().int().nonnegative(),
  activeClientCount: z.number().int().nonnegative(),
})

export async function aggregateVerifiedBusinessAnalytics(profileId: string) {
  // Roll up from batch tables — never query per-user health data
  return verifiedBusinessAnalyticsSchema.parse({
    profileViews: 0,
    mapListingTaps: 0,
    aggregateScanCount: 0,
    aggregateMenuViews: 0,
    uncertaintyTrends: [],
  })
}

export async function aggregateVerifiedPersonAnalytics(profileId: string) {
  return verifiedPersonAnalyticsSchema.parse({
    profileViews: 0,
    publicRecipeViews: 0,
    recipeSaves: 0,
    cookStarts: 0,
    activeClientCount: 0,
  })
}
```

**Blocked:** individual user identity, allergy/condition breakdowns, per-user scan histories, Mesa data.
