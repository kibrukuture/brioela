# Draft: handle.sickness.followup.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/handle.sickness.followup.handler.ts`

**Gap (feature 32):** Body for `sickness_followup` alarm. **14** owns `dispatchAlarm` case + `runInlineAlarmSession` shell.

**Source:** `implementable-specs/10-scheduled-alarms.md`, `05-output-privacy-and-followup.md`.

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { ScheduledAlarmRow } from '@/agents/brain/_schemas/scheduled.alarm.schema'
import { runInlineAlarmSession } from '@/agents/brain/_handlers/run.inline.alarm.session.handler'
import { buildSicknessFollowupPrompt } from '@/agents/brain/_helpers/build.sickness.followup.prompt.helper'

export async function handleSicknessFollowup(
	database: BrainDatabase,
	brain: BrioelaBrain,
	alarm: ScheduledAlarmRow,
): Promise<void> {
	const payload = alarm.payload as {
		report_id?: string
		symptom_onset_hours?: number
		memory_event_ids?: string[]
		symptoms_reported?: string
	}

	const systemPrompt = buildSicknessFollowupPrompt({
		reportId: payload.report_id,
		symptomOnsetHours: payload.symptom_onset_hours,
		memoryEventIds: payload.memory_event_ids ?? [],
		symptomsReported: payload.symptoms_reported,
	})

	await runInlineAlarmSession(database, brain, {
		userId: alarm.userId,
		alarmType: 'sickness_followup',
		systemPrompt,
		maxTurns: 4,
	})

	// Optional: update action_outcome_json on alarm row with check-in result
}
```

Prompt must ask how user feels, offer to re-run Sift or mark report resolved — never diagnose.
