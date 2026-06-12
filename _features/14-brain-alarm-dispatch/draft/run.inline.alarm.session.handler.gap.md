# Draft: run.inline.alarm.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/run.inline.alarm.session.handler.ts`

**Gap (feature 14):** Shared shell for `sickness_followup`, `travel_preload`, `scan_followup` — opens `alarm` session, runs bounded LLM loop (**20**), closes session.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { readCurrentEpochMs } from '@/time/_helpers'

export type InlineAlarmSessionInput = {
	userId: string
	alarmType: string
	systemPrompt: string
	maxTurns?: number
}

export async function runInlineAlarmSession(
	database: BrainDatabase,
	brain: BrioelaBrain,
	input: InlineAlarmSessionInput,
): Promise<{ sessionId: string; outcomeSummary: string }> {
	const sessionId = createId()
	const now = readCurrentEpochMs()

	// TODO(11): openSession with sessionType: 'alarm', alarmType: input.alarmType
	// TODO(20): bounded generateText loop with getBrainTools(..., kind: 'alarm', wake)
	// TODO(11): closeSession(sessionId, 'completed', outcomeSummary)

	return {
		sessionId,
		outcomeSummary: `Alarm session ${input.alarmType} completed.`,
	}
}
```

Feature handlers (`handle.sickness.followup`, etc.) build `systemPrompt` and call this shell.
