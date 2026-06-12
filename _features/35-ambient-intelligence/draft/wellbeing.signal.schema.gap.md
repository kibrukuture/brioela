# Draft: wellbeing.signal.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/wellbeing.signal.schema.ts`

**Gap (feature 35):** Passive transcript-derived wellbeing signals linked to recent food context. Spec **17** product table — separate from **12** `pattern.*` facts.

**Source:** `brioela-specs/17-behavioral-food-pattern-detection.md`, `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const wellbeingSignalTypeValues = [
  'energy_low',
  'energy_high',
  'stomach_discomfort',
  'mood_low',
  'mood_positive',
] as const
export type WellbeingSignalType = (typeof wellbeingSignalTypeValues)[number]

export const wellbeingSignals = sqliteTable('wellbeing_signal', {
  signalId: text('signal_id').primaryKey(),
  userId: text('user_id').notNull(),
  signalType: text('signal_type').notNull().$type<WellbeingSignalType>(),
  sourceSession: text('source_session').notNull(),
  foodContextJson: text('food_context_json').notNull(),
  capturedAt: integer('captured_at').notNull(),
})

export type WellbeingSignalRow = typeof wellbeingSignals.$inferSelect
export type InsertWellbeingSignalRow = typeof wellbeingSignals.$inferInsert
```

Indexes: `(user_id, captured_at DESC)`, `(source_session)`.

`food_context_json`: `{ lookbackHours, scanEventIds, receiptEventIds, recipeIds }`.
