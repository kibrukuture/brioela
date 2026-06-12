# Draft: medications.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/medications.schema.ts`

Source: `build-guide/06-brain-memory/01-sqlite-schema.md` (authoritative column names — prefer over `29-health-intelligence/01` `drugName` drift).

---

## Intended production file

```typescript
import { check, index, integer, real, sqliteTable, text } from '@/database/sqlite/_schema'

export const medications = sqliteTable(
	'medications',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		medicationName: text('medication_name').notNull(),
		medicationCategory: text('medication_category').notNull(),
		doseMg: real('dose_mg'),
		doseUnit: text('dose_unit'),
		frequency: text('frequency').notNull(),
		reminderTimes: text('reminder_times').notNull(),
		withFood: integer('with_food', { mode: 'boolean' }),
		notes: text('notes'),
		source: text('source').notNull(),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		startedAt: integer('started_at', { mode: 'number' }),
		endedAt: integer('ended_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('medications_reminder_times_json_array_check', /* json array of HH:MM strings */),
		index('idx_medications_active').on(table.userId, table.active, table.medicationCategory),
	],
)

export type BrainMedication = typeof medications.$inferSelect
export type NewBrainMedication = typeof medications.$inferInsert
```

`reminder_times` JSON example: `["08:00", "20:00"]`. On create → `scheduleMedicationReminders` inserts `medication_reminder` alarm rows.
