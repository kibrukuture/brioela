# Draft: ambient.suppression.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/ambient.suppression.schema.ts`

**Gap (feature 35):** Per-family dismiss counters — may merge with **21** `notification_suppression` at implementation (G20).

**Source:** `build-guide/18-ambient-intelligence/06-surfacing-and-privacy.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const ambientSuppressionFamilyValues = [
  'patterns',
  'travel',
  'time_machine',
  'guest_mode',
] as const
export type AmbientSuppressionFamily = (typeof ambientSuppressionFamilyValues)[number]

export const ambientSuppressions = sqliteTable('ambient_suppression', {
  userId: text('user_id').notNull(),
  family: text('family').notNull().$type<AmbientSuppressionFamily>(),
  dismissedCount: integer('dismissed_count').notNull().default(0),
  suppressedUntil: integer('suppressed_until'),
  permanentlySuppressed: integer('permanently_suppressed', { mode: 'boolean' })
    .notNull()
    .default(false),
  updatedAt: integer('updated_at').notNull(),
})

// Composite primary key (user_id, family) in migration SQL
```

Rules: 2 dismissals → 14d suppress; 3 → permanent. Critical safety not governed here.
