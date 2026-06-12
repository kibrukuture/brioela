# Draft: illness.suspect.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/illness.suspect.schema.ts`

**Gap (feature 32):** Ranked suspect rows per `illness_report`.

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const illnessSuspectTypeValues = ['product', 'restaurant', 'meal'] as const
export type IllnessSuspectType = (typeof illnessSuspectTypeValues)[number]

export const illnessSuspects = sqliteTable('illness_suspect', {
	id: text('id').primaryKey(),
	reportId: text('report_id')
		.notNull()
		.references(() => illnessReports.id),
	suspectType: text('suspect_type').notNull().$type<IllnessSuspectType>(),
	suspectId: text('suspect_id').notNull(),
	confidenceScore: real('confidence_score').notNull(),
	reasonCode: text('reason_code').notNull(),
	reasonText: text('reason_text').notNull(),
	rank: integer('rank').notNull(),
	recallActive: integer('recall_active', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at').notNull(),
})

import { illnessReports } from './illness.report.schema'

export type IllnessSuspectRow = typeof illnessSuspects.$inferSelect
export type InsertIllnessSuspectRow = typeof illnessSuspects.$inferInsert
```

Unique constraint: `(report_id, rank)` where rank ∈ {1,2,3}.
