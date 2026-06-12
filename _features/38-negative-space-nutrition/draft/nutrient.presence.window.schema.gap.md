# Draft: nutrient.presence.window.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/nutrient.presence.window.schema.ts`

**Gap:** No `nutrient_presence_window` table for coverage audit trail.

**Source:** `brioela-specs/50-negative-space-nutrition.md` Data Model

---

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const nutrientPresenceWindow = sqliteTable('nutrient_presence_window', {
  windowId: text('window_id').primaryKey(),
  userId: text('user_id').notNull(),
  periodStart: integer('period_start').notNull(),
  periodEnd: integer('period_end').notNull(),
  coverageScore: real('coverage_score').notNull(),
  presenceMapJson: text('presence_map_json').notNull(),
  computedAt: integer('computed_at').notNull(),
})

export type NutrientPresenceWindowRow = typeof nutrientPresenceWindow.$inferSelect
export type InsertNutrientPresenceWindowRow = typeof nutrientPresenceWindow.$inferInsert
```
