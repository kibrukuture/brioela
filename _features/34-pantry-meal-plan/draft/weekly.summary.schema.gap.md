# Draft: weekly.summary.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/weekly.summary.schema.ts`

**Gap (feature 34):** Weekly food behavior rollup — retrospective, not inventory (spec 16).

**Source:** `brioela-specs/16-weekly-food-summary.md`, `build-guide/14-pantry-meal-plan/06-weekly-food-summary.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const weeklySummaries = sqliteTable('weekly_summary', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  weekStart: text('week_start').notNull(),
  summaryJson: text('summary_json').notNull(),
  generatedAt: integer('generated_at').notNull(),
  deliveredAt: integer('delivered_at'),
})

export type WeeklySummaryRow = typeof weeklySummaries.$inferSelect
export type InsertWeeklySummaryRow = typeof weeklySummaries.$inferInsert
```

`summary_json` shape: `{ oneLiner, observations: string[], action?: string, shareableMoment?: string }`.

Indexes: `(user_id, week_start)` unique, `(user_id, generated_at DESC)`.
