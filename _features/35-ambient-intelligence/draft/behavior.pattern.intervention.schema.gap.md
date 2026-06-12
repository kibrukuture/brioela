# Draft: behavior.pattern.intervention.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/behavior.pattern.intervention.schema.ts`

**Gap (feature 35):** Audit trail for conversational pattern interventions — max one new insight per week.

**Source:** `brioela-specs/17-behavioral-food-pattern-detection.md`, `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const patternInterventionSurfaceValues = [
  'conversation',
  'scan_inline',
  'weekly_summary',
] as const
export type PatternInterventionSurface = (typeof patternInterventionSurfaceValues)[number]

export const behaviorPatternInterventions = sqliteTable('behavior_pattern_intervention', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  patternId: text('pattern_id').notNull(),
  interventionType: text('intervention_type').notNull(),
  suggestedLine: text('suggested_line').notNull(),
  surface: text('surface').notNull().$type<PatternInterventionSurface>(),
  surfacedInSession: text('surfaced_in_session'),
  createdAt: integer('created_at').notNull(),
  actedOnAt: integer('acted_on_at'),
  dismissedAt: integer('dismissed_at'),
})

export type BehaviorPatternInterventionRow = typeof behaviorPatternInterventions.$inferSelect
```
