# Draft: encore.refinement.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/encore.refinement.schema.ts`

**Gap (feature 48):** Post-cook field refinement audit trail.

**Source:** `build-guide/31-encore/05-share-and-records.md`

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const encoreRefinementEvidenceValues = [
	'taste_check',
	'user_verdict',
	'agent_update',
] as const

export type EncoreRefinementEvidence = (typeof encoreRefinementEvidenceValues)[number]

export const encoreRefinements = sqliteTable(
	'encore_refinement',
	{
		id: text('id').primaryKey(),
		encoreId: text('encore_id').notNull(),
		sessionId: text('session_id'),
		fieldChanged: text('field_changed').notNull(),
		oldValue: text('old_value').notNull(),
		newValue: text('new_value').notNull(),
		evidence: text('evidence', { enum: encoreRefinementEvidenceValues }).notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [index('encore_refinement_encore_index').on(table.encoreId, table.createdAt)],
)

export type EncoreRefinementRow = typeof encoreRefinements.$inferSelect
export type NewEncoreRefinementRow = typeof encoreRefinements.$inferInsert
```
