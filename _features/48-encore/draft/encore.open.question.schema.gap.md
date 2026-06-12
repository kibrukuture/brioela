# Draft: encore.open.question.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/encore.open.question.schema.ts`

**Gap (feature 48):** Open questions for taste-check prompts during first cook.

**Source:** `build-guide/31-encore/05-share-and-records.md`

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const encoreOpenQuestions = sqliteTable(
	'encore_open_question',
	{
		id: text('id').primaryKey(),
		encoreId: text('encore_id').notNull(),
		component: text('component').notNull(),
		questionText: text('question_text').notNull(),
		resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
		resolutionNote: text('resolution_note'),
		resolvedInSessionId: text('resolved_in_session_id'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		index('encore_open_question_encore_index').on(table.encoreId, table.resolved),
	],
)

export type EncoreOpenQuestionRow = typeof encoreOpenQuestions.$inferSelect
export type NewEncoreOpenQuestionRow = typeof encoreOpenQuestions.$inferInsert
```
