# Draft: create.medication.handler.ts (gap)

Target: `backend/src/agents/brain/_handlers/create.medication.handler.ts`

Source: `01-medication-tracking.md` — voice, photo, manual paths converge here.

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { NewBrainMedication } from '@/agents/brain/_schemas/medications.schema'
import { medications } from '@/agents/brain/_schemas'
import { scheduleMedicationReminders } from '@/agents/brain/_helpers/schedule.medication.reminders.helper'
import { normalizeMedicationCategory } from '@/agents/brain/_helpers/normalize.medication.category.helper'
import { readCurrentEpochMs } from '@/time/_helpers'

export type CreateMedicationInput = {
	userId: string
	medicationName: string
	doseMg?: number
	doseUnit?: string
	frequency: string
	reminderTimes: string[]
	withFood?: boolean
	notes?: string
	source: 'photo' | 'voice' | 'manual' | 'pdf'
}

export function createMedication(database: BrainDatabase, input: CreateMedicationInput): string {
	const now = readCurrentEpochMs()
	const id = crypto.randomUUID()
	const category = normalizeMedicationCategory(input.medicationName)

	const row: NewBrainMedication = {
		id,
		userId: input.userId,
		medicationName: input.medicationName,
		medicationCategory: category,
		doseMg: input.doseMg ?? null,
		doseUnit: input.doseUnit ?? null,
		frequency: input.frequency,
		reminderTimes: JSON.stringify(input.reminderTimes),
		withFood: input.withFood ?? null,
		notes: input.notes ?? null,
		source: input.source,
		active: true,
		startedAt: now,
		endedAt: null,
		createdAt: now,
		updatedAt: now,
	}

	database.insert(medications).values(row).run()
	scheduleMedicationReminders(database, row as typeof medications.$inferSelect)

	// Optional: mirror summary to user_memory health.medications — not operational source

	return id
}
```

Callable via Brain `@callable()` for voice tool `create_medication` and mobile API.
