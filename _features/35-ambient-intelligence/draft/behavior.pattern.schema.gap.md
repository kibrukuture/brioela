# Draft: behavior.pattern.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/behavior.pattern.schema.ts`

**Gap (feature 35):** Product-facing behavior patterns with evidence and lifecycle — complements **12** `pattern.*` `user_memory` (lower bar, not user-facing).

**Source:** `brioela-specs/17-behavioral-food-pattern-detection.md`, `build-guide/18-ambient-intelligence/02-behavioral-patterns.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const behaviorPatternTypeValues = [
  'energy_correlation',
  'stress_eating',
  'post_sickness_association',
  'aversion',
  'dietary_drift',
  'travel_food_preparation',
  'craving_correlation',
] as const
export type BehaviorPatternType = (typeof behaviorPatternTypeValues)[number]

export const behaviorPatternStatusValues = [
  'candidate',
  'active',
  'dismissed',
  'stale',
] as const
export type BehaviorPatternStatus = (typeof behaviorPatternStatusValues)[number]

export const behaviorPatterns = sqliteTable('behavior_pattern', {
  patternId: text('pattern_id').primaryKey(),
  userId: text('user_id').notNull(),
  patternType: text('pattern_type').notNull().$type<BehaviorPatternType>(),
  evidenceJson: text('evidence_json').notNull(),
  summary: text('summary').notNull(),
  confidence: real('confidence').notNull(),
  firstSeenAt: integer('first_seen_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
  status: text('status').notNull().$type<BehaviorPatternStatus>(),
})

export type BehaviorPatternRow = typeof behaviorPatterns.$inferSelect
export type InsertBehaviorPatternRow = typeof behaviorPatterns.$inferInsert
```

`evidence_json`: array of event IDs + timestamps supporting the pattern.
