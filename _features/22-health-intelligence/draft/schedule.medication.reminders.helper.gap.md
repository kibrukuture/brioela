# Draft: schedule.medication.reminders.helper.ts (gap)

Target: `backend/src/agents/brain/_helpers/schedule.medication.reminders.helper.ts`

Source: `01-medication-tracking.md`

```typescript
import { eq } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainMedication } from '@/agents/brain/_schemas/medications.schema'
import { scheduledAlarms } from '@/agents/brain/_schemas'
import { getNextAlarmTimeForLocalTime } from '@/agents/brain/_helpers/get.next.alarm.time.helper'
import { readCurrentEpochMs } from '@/time/_helpers'

export function scheduleMedicationReminders(database: BrainDatabase, medication: BrainMedication): void {
	const reminderTimes = JSON.parse(medication.reminderTimes) as string[]
	const now = readCurrentEpochMs()

	for (const timeStr of reminderTimes) {
		const nextFire = getNextAlarmTimeForLocalTime(timeStr, medication.userId)

		database
			.insert(scheduledAlarms)
			.values({
				id: crypto.randomUUID(),
				userId: medication.userId,
				alarmType: 'medication_reminder',
				payload: JSON.stringify({
					medicationId: medication.id,
					drugName: medication.medicationName,
					doseInfo: `${medication.doseMg ?? ''}${medication.doseUnit ?? ''}`,
				}),
				scheduledAt: nextFire,
				label: `${medication.medicationName} reminder`,
				status: 'pending',
				actionOutcomeStatus: null,
				actionOutcomeJson: null,
				createdAt: now,
				updatedAt: now,
			})
			.run()
	}

	// Refresh DO wake slot: readEarliestPendingScheduledAt → scheduleAlarm
}
```

On medication update: cancel pending rows for `medicationId` in payload, re-insert.
