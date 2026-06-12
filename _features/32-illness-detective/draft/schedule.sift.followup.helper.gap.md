# Draft: schedule.sift.followup.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/schedule.sift.followup.helper.ts`

**Source:** `build-guide/16-illness-detective/05-output-privacy-and-followup.md`, `implementable-specs/10-scheduled-alarms.md`.

Default **24h**; agent may schedule 4–24h per implementable spec band.

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { scheduleUserAlarmExecutable } from '@/agents/brain/_tools/schedule.user.alarm.executable'
import { createAlarmWakeCallbacks } from '@/agents/brain/_helpers/alarm.wake.callbacks.helper'

const DEFAULT_FOLLOWUP_MS = 24 * 60 * 60 * 1000

export type ScheduleSiftFollowupInput = {
	reportId: string
	symptomOnsetHours: number
	memoryEventIds?: string[]
}

export async function scheduleSiftFollowup(
	database: BrainDatabase,
	brain: BrioelaBrain,
	userId: string,
	input: ScheduleSiftFollowupInput,
): Promise<{ alarmId: string }> {
	const wake = createAlarmWakeCallbacks(brain)
	const scheduledAt = Date.now() + DEFAULT_FOLLOWUP_MS

	const result = await scheduleUserAlarmExecutable(database, userId, {
		alarm_type: 'sickness_followup',
		scheduled_at: scheduledAt,
		payload: {
			report_id: input.reportId,
			symptom_onset_hours: input.symptomOnsetHours,
			memory_event_ids: input.memoryEventIds ?? [],
		},
		triggering_session_id: brain.getCurrentSessionId?.() ?? null,
	}, wake)

	if (result.status !== 'pending') {
		throw new Error(`expected pending sickness_followup schedule, got ${result.status}`)
	}

	return { alarmId: result.id }
}
```

Uses `sickness_followup` — not obsolete `illness-followup` from `06-backend-do-agent-patterns.md`.
