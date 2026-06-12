# Draft: vision.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/vision.event.schema.ts`

**Gap:** No `vision_event` table; no `evidence_source` column.

**Source:** `brioela-specs/11-live-vision-cooking-coach.md`, `brioela-specs/46-acoustic-cooking-intelligence.md`, `build-guide/33-acoustic-cooking/03-intervention-events.md`

---

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const evidenceSourceValues = ['visual', 'acoustic', 'fused'] as const
export type EvidenceSource = (typeof evidenceSourceValues)[number]

export const interventionEventTypeValues = [
  'heat_warning',
  'boil_over_warning',
  'burning_onset',
  'step_confirmed',
  'abnormal_silence',
  'technique_note',
  'generic_intervention',
] as const
export type InterventionEventType = (typeof interventionEventTypeValues)[number]

export const visionEvent = sqliteTable('vision_event', {
  eventId: text('event_id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: text('user_id').notNull(),
  eventType: text('event_type').notNull(),
  confidence: real('confidence').notNull(),
  evidenceSource: text('evidence_source', { enum: evidenceSourceValues }).notNull(),
  recipeStepOrder: integer('recipe_step_order'),
  createdAt: integer('created_at').notNull(),
})

export type VisionEventRow = typeof visionEvent.$inferSelect
export type NewVisionEventRow = typeof visionEvent.$inferInsert
```
