# Draft: predictive.nudge.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/predictive.nudge.schema.ts`

**Gap (feature 34):** Surfaced predictive need predictions with outcome tracking.

**Source:** `brioela-specs/36-predictive-pantry-intelligence.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const predictiveNudgeOutcomeValues = [
  'bought',
  'dismissed',
  'expired',
] as const
export type PredictiveNudgeOutcome = (typeof predictiveNudgeOutcomeValues)[number]

export const predictiveNudges = sqliteTable('predictive_nudge', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  itemKey: text('item_key').notNull(),
  predictedNeedDate: integer('predicted_need_date').notNull(),
  surfacedAt: integer('surfaced_at'),
  resolvedAt: integer('resolved_at'),
  outcome: text('outcome').$type<PredictiveNudgeOutcome>(),
  createdAt: integer('created_at').notNull(),
})

export type PredictiveNudgeRow = typeof predictiveNudges.$inferSelect
export type InsertPredictiveNudgeRow = typeof predictiveNudges.$inferInsert
```

Surface when `today >= predicted_need_date - 3 days` (spec 36).

Indexes: `(user_id, resolved_at)`, `(user_id, item_key)`.
