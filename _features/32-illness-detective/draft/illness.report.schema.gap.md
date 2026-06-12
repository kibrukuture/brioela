# Draft: illness.report.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/illness.report.schema.ts`

**Gap (feature 32):** Private Brain SQLite table for Sift investigation sessions. Not yet in `06-brain-memory/01-sqlite-schema.md` — add via **04** migration.

**Source:** `brioela-specs/30-food-illness-detective.md`, `build-guide/16-illness-detective/01-illness-report-flow.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const illnessReportStatusValues = ['open', 'resolved', 'dismissed'] as const
export type IllnessReportStatus = (typeof illnessReportStatusValues)[number]

export const illnessReports = sqliteTable('illness_report', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull(),
	symptomOnsetAt: integer('symptom_onset_at').notNull(),
	reportedAt: integer('reported_at').notNull(),
	windowStart: integer('window_start').notNull(),
	windowEnd: integer('window_end').notNull(),
	status: text('status').notNull().$type<IllnessReportStatus>(),
	triggeringSessionId: text('triggering_session_id'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
})

export type IllnessReportRow = typeof illnessReports.$inferSelect
export type InsertIllnessReportRow = typeof illnessReports.$inferInsert
```

Indexes to add in migration: `(user_id, status)`, `(user_id, reported_at DESC)`.
