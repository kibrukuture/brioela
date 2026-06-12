# Draft: spend.summary.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/spend.summary.schema.ts`

**Source:** `brioela-specs/06-receipt-spend-intelligence.md`, `build-guide/13-receipt-intelligence/04-spend-summaries.md`

---

```typescript
import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const spendSummaries = sqliteTable('spend_summary', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  weekStart: integer('week_start').notNull(),
  healthySpend: real('healthy_spend').notNull().default(0),
  nonHealthySpend: real('non_healthy_spend').notNull().default(0),
  uncategorizedSpend: real('uncategorized_spend').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  computedAt: integer('computed_at').notNull(),
})

export type SpendSummaryRow = typeof spendSummaries.$inferSelect
```

Unique: `(user_id, week_start)`. Computed on Brain alarm cycle — not on receipt view.
