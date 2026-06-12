# Draft: pantry.routes.ts (gap — file does not exist)

Target: `shared/routes/pantry.routes.ts`

**Gap (feature 34):** Route constants for pantry, meal plan, shopping list, weekly summary APIs.

---

```typescript
export const PANTRY_ROUTES = {
  SNAPSHOTS: '/api/pantry/snapshots',
  SNAPSHOT_MATCHES: '/api/pantry/snapshots/:id/matches',
  MEAL_PLANS_GENERATE: '/api/meal-plans/generate',
  MEAL_PLANS_ACTIVE: '/api/meal-plans/active',
  MEAL_PLAN_SLOT_SWAP: '/api/meal-plans/slots/:id/swap',
  SHOPPING_LIST: '/api/shopping-list',
  SHOPPING_LIST_ITEM: '/api/shopping-list/:id',
  WEEKLY_SUMMARY_LATEST: '/api/weekly-summary/latest',
} as const
```
