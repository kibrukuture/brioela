# Draft: ambient.candidate.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/ambient.candidate.schema.ts`

**Gap (feature 35):** Unified pre-surface queue — prevents raw inference becoming user copy immediately.

**Source:** `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const ambientCandidateKindValues = [
  'behavior_pattern_intervention',
  'travel_preload',
  'time_machine_moment',
  'guest_memory_promotion',
  'find_to_cooking',
] as const
export type AmbientCandidateKind = (typeof ambientCandidateKindValues)[number]

export const ambientCandidatePriorityValues = ['low', 'medium', 'high'] as const
export type AmbientCandidatePriority = (typeof ambientCandidatePriorityValues)[number]

export const ambientCandidateStatusValues = [
  'candidate',
  'surfaced',
  'dismissed',
  'expired',
] as const
export type AmbientCandidateStatus = (typeof ambientCandidateStatusValues)[number]

export const ambientCandidates = sqliteTable('ambient_candidate', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  kind: text('kind').notNull().$type<AmbientCandidateKind>(),
  payloadJson: text('payload_json').notNull(),
  confidence: real('confidence').notNull(),
  priority: text('priority').notNull().$type<AmbientCandidatePriority>(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at'),
  surfacedAt: integer('surfaced_at'),
  status: text('status').notNull().$type<AmbientCandidateStatus>(),
})

export type AmbientCandidateRow = typeof ambientCandidates.$inferSelect
```
