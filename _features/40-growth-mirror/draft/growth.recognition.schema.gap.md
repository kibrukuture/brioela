# Draft: growth.recognition.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/growth.recognition.schema.ts`

**Gap:** No `growth_recognition` queue table.

**Source:** `brioela-specs/53-growth-mirror.md` § Data Model, `build-guide/40-growth-mirror/03-recognition-budget.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const growthRecognitionStatusValues = ['candidate', 'surfaced', 'expired'] as const
export type GrowthRecognitionStatus = (typeof growthRecognitionStatusValues)[number]

export const growthRecognition = sqliteTable(
	'growth_recognition',
	{
		recognitionId: text('recognition_id').primaryKey(),
		userId: text('user_id').notNull(),
		dimension: text('dimension').notNull(),
		headline: text('headline').notNull(),
		evidenceRefsJson: text('evidence_refs_json').notNull(),
		status: text('status', { enum: growthRecognitionStatusValues }).notNull(),
		surfacedIn: text('surfaced_in'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		surfacedAt: integer('surfaced_at', { mode: 'number' }),
	},
	(table) => [
		check(
			'growth_recognition_evidence_refs_json_array_check',
			sql`json_valid(${table.evidenceRefsJson}) and json_type(${table.evidenceRefsJson}) = 'array'`,
		),
		check('growth_recognition_created_at_check', sql`${table.createdAt} >= 0`),
		index('growth_recognition_user_status_created_index').on(
			table.userId,
			table.status,
			table.createdAt,
		),
		index('growth_recognition_user_dimension_index').on(table.userId, table.dimension),
	],
)

export type GrowthRecognitionRow = typeof growthRecognition.$inferSelect
export type NewGrowthRecognitionRow = typeof growthRecognition.$inferInsert
```
