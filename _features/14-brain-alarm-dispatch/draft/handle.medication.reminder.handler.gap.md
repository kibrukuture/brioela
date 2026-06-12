# Draft: handle.medication.reminder.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/handle.medication.reminder.handler.ts`

**Gap (feature 14 + 22):** Medication alarm fire path from `build-guide/29-health-intelligence/02-medication-reminders.md`.

**Owner split:** **14** dispatches case; **22** owns Vapi/OneSignal providers and `scheduleNextMedicationReminder`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { eq } from 'drizzle-orm'
import type { BrioelaBrain, BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'
import { scheduledAlarms } from '@/agents/brain/_schemas'
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

	// TODO(22): load medication row — medications table / health module
	const requiresCall = false
	const userPhone: string | null = null

	if (requiresCall && userPhone) {
		// TODO(22): triggerMedicationCall({ phone, drugName, doseInfo, reminderId: alarm.id, userId, env })
		database
			.update(scheduledAlarms)
			.set({
				actionOutcomeStatus: 'calling',
				updatedAt: now,
			})
			.where(eq(scheduledAlarms.id, alarm.id))
			.run()
	} else {
		// TODO(22): triggerMedicationPush({ drugName, doseInfo, reminderId: alarm.id, userId, env })
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

	// TODO(22): scheduleNextMedicationReminder(database, medicationId)
}
```

Outcome webhook updates `action_outcome_status` / `action_outcome_json` on same row per `02-medication-reminders.md`.
