# Draft: guest.session.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/guest.session.schema.ts`

**Gap (feature 35):** Temporary guest constraint layer — no guest names.

**Source:** `brioela-specs/37-guest-and-cooking-for-others.md`, `build-guide/18-ambient-intelligence/05-guest-mode.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const guestSessionStatusValues = ['active', 'archived'] as const
export type GuestSessionStatus = (typeof guestSessionStatusValues)[number]

export const guestSessions = sqliteTable('guest_session', {
  sessionId: text('session_id').primaryKey(),
  userId: text('user_id').notNull(),
  constraintsJson: text('constraints_json').notNull(),
  occasion: text('occasion'),
  recipesUsedJson: text('recipes_used_json').notNull().default('[]'),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  status: text('status').notNull().$type<GuestSessionStatus>(),
})

export type GuestSessionRow = typeof guestSessions.$inferSelect
```

`constraints_json`: `Array<{ type: 'allergen'|'intolerance'|'dietary_identity'|'preference'; value: string; severity: 'hard'|'soft' }>`.
