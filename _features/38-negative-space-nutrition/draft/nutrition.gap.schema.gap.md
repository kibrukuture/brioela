# Draft: nutrition.gap.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/nutrition.gap.schema.ts`

**Gap:** No `nutrition_gap` lifecycle table.

**Source:** `brioela-specs/50-negative-space-nutrition.md` Data Model

---

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const nutritionGapStatus = [
  'candidate',
  'surfaced',
  'watching',
  'closed',
] as const

export const nutritionGapClass = ['structural', 'displacement'] as const

export const nutritionGapClosedReason = [
  'user_covers_elsewhere',
  'user_declined',
  'resolved',
  'condition_handoff',
] as const

export const nutritionGap = sqliteTable('nutrition_gap', {
  gapId: text('gap_id').primaryKey(),
  userId: text('user_id').notNull(),
  category: text('category').notNull(),
  gapClass: text('gap_class', { enum: nutritionGapClass }).notNull(),
  evidenceJson: text('evidence_json').notNull(),
  confidence: real('confidence').notNull(),
  status: text('status', { enum: nutritionGapStatus }).notNull(),
  closedReason: text('closed_reason', { enum: nutritionGapClosedReason }),
  surfacedIn: text('surfaced_in'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type NutritionGapRow = typeof nutritionGap.$inferSelect
```
