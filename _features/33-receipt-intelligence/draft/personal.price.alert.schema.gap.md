# Draft: personal.price.alert.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/personal.price.alert.schema.ts`

**Naming:** Spec 29 calls this `price_alert`. **28** uses `alert_candidate` for shared geo alerts. **33** uses `personal_price_alert` in Brain SQLite to avoid collision.

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`

---

```typescript
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const personalPriceAlertTypeValues = ['increase', 'decrease'] as const
export type PersonalPriceAlertType = (typeof personalPriceAlertTypeValues)[number]

export const personalPriceAlerts = sqliteTable('personal_price_alert', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  upc: text('upc'),
  productId: text('product_id').notNull(),
  alertType: text('alert_type').notNull().$type<PersonalPriceAlertType>(),
  pctChange: real('pct_change').notNull(),
  baselinePrice: real('baseline_price').notNull(),
  currentPrice: real('current_price').notNull(),
  storeName: text('store_name'),
  placeId: text('place_id'),
  suggestionProductId: text('suggestion_product_id'),
  purchasePriceEventId: text('purchase_price_event_id'),
  createdAt: integer('created_at').notNull(),
  dismissedAt: integer('dismissed_at'),
})

export type PersonalPriceAlertRow = typeof personalPriceAlerts.$inferSelect
```

**Boundary:** Personal alerts stay in Brain. Geo push `price_alert` kind → **28** `alert_candidate` + **21** delivery.
