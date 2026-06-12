# Draft: kids.mode.scan.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/kids.mode.scan.event.schema.ts`

**Gap:** No `kids_mode_scan_event` table.

**Source:** `build-guide/21-kids-mode/06-data-model-and-metrics.md`, `02-scan-explanation.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'
import { kidsModeAgeRangeValues } from './kids.mode.profile.schema'

export const kidsModeScanEvent = sqliteTable(
	'kids_mode_scan_event',
	{
		id: text('id').primaryKey(),
		scanEventId: text('scan_event_id').notNull(),
		userId: text('user_id').notNull(),
		ageRange: text('age_range', { enum: kidsModeAgeRangeValues }).notNull(),
		explanationText: text('explanation_text').notNull(),
		sourceConfidence: integer('source_confidence', { mode: 'number' }).notNull(),
		safetyContext: text('safety_context', {
			enum: ['none', 'allergy_warning', 'low_confidence', 'both'],
		})
			.notNull()
			.default('none'),
		explanationSpoken: integer('explanation_spoken', { mode: 'boolean' })
			.notNull()
			.default(false),
		shared: integer('shared', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'kids_mode_scan_event_safety_context_check',
			sql`${table.safetyContext} in ('none', 'allergy_warning', 'low_confidence', 'both')`,
		),
		check('kids_mode_scan_event_confidence_check', sql`${table.sourceConfidence} >= 0`),
		check('kids_mode_scan_event_created_at_check', sql`${table.createdAt} >= 0`),
		index('kids_mode_scan_event_scan_index').on(table.scanEventId),
		index('kids_mode_scan_event_user_created_index').on(table.userId, table.createdAt),
	],
)

export type KidsModeScanEventRow = typeof kidsModeScanEvent.$inferSelect
export type NewKidsModeScanEventRow = typeof kidsModeScanEvent.$inferInsert
```
