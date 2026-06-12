# Draft: handle.medication.reminder.handler.ts (gap)

Target: `backend/src/agents/brain/_handlers/handle.medication.reminder.handler.ts`

**Owner split:** **14** dispatches case; **22** owns handler body + providers.

Source: `02-medication-reminders.md`. Cross-ref: `_features/14-brain-alarm-dispatch/draft/handle.medication.reminder.handler.gap.md`.

```typescript
import { eq } from 'drizzle-orm'
import type { BrioelaBrain, BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'
import { medications, scheduledAlarms } from '@/agents/brain/_schemas'
import { triggerMedicationCall } from '@/api/health/medication-call.helper'
import { triggerMedicationPush } from '@/core/notifications/trigger-medication-push.helper'
import { scheduleNextMedicationReminder } from '@/agents/brain/_helpers/schedule.next.medication.reminder.helper'
import { readCurrentEpochMs } from '@/time/_helpers'

const HIGH_STAKES_MEDICATION_CATEGORIES = [
	'anticoagulant',
	'insulin',
	'immunosuppressant',
	'antiepileptic',
	'antipsychotic',
	'cardiac',
] as const

type MedicationReminderPayload = {
	medicationId: string
	drugName: string
	doseInfo: string
}

export async function handleMedicationReminder(
	database: BrainDatabase,
	_brain: BrioelaBrain,
	alarm: BrainScheduledAlarm,
	payload: Record<string, unknown>,
	env: BrioelaBrainEnv,
): Promise<void> {
	const { medicationId, drugName, doseInfo } = payload as MedicationReminderPayload
	const now = readCurrentEpochMs()

	const medication = database
		.select()
		.from(medications)
		.where(eq(medications.id, medicationId))
		.get()

	const requiresCall =
		medication !== undefined &&
		HIGH_STAKES_MEDICATION_CATEGORIES.includes(
			medication.medicationCategory as (typeof HIGH_STAKES_MEDICATION_CATEGORIES)[number],
		)

	const userPhone = await getUserPhoneForMedicationReminder(alarm.userId, env)

	if (requiresCall && userPhone) {
		await triggerMedicationCall({
			phone: userPhone,
			drugName,
			doseInfo,
			reminderId: alarm.id,
			userId: alarm.userId,
			env,
		})
		database
			.update(scheduledAlarms)
			.set({ actionOutcomeStatus: 'calling', updatedAt: now })
			.where(eq(scheduledAlarms.id, alarm.id))
			.run()
	} else {
		await triggerMedicationPush({ drugName, doseInfo, reminderId: alarm.id, userId: alarm.userId })
		database
			.update(scheduledAlarms)
			.set({
				actionOutcomeStatus: 'notified',
				actionOutcomeJson: JSON.stringify({ notified_at: now }),
				updatedAt: now,
			})
			.where(eq(scheduledAlarms.id, alarm.id))
			.run()
	}

	await scheduleNextMedicationReminder(database, medicationId, alarm.userId)
}
```

Push must use **21** `triggerMedicationPush` — not raw OneSignal (G15).
