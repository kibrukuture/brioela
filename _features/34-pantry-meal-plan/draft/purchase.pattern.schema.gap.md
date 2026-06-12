# Draft: purchase.pattern.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/purchase.pattern.schema.ts`

**Gap (feature 34):** Median purchase interval model per regularly bought item (spec 36).

**Source:** `brioela-specs/36-predictive-pantry-intelligence.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const confidenceTierValues = ['high', 'medium', 'low'] as const
export type ConfidenceTier = (typeof confidenceTierValues)[number]

export const purchasePatterns = sqliteTable('purchase_pattern', {
  itemKey: text('item_key').primaryKey(),
  userId: text('user_id').notNull(),
  displayName: text('display_name').notNull(),
  purchaseDatesJson: text('purchase_dates').notNull(),
  medianIntervalDays: integer('median_interval_days').notNull(),
  lastPurchased: integer('last_purchased').notNull(),
  confidenceTier: text('confidence_tier').notNull().$type<ConfidenceTier>(),
  dismissed: integer('dismissed').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
})

export type PurchasePatternRow = typeof purchasePatterns.$inferSelect
export type InsertPurchasePatternRow = typeof purchasePatterns.$inferInsert
```

Minimum events: 3 → medium; 5+ low variance → high (spec 36).

Indexes: `(user_id, dismissed)`, `(user_id, confidence_tier)`.
