# Draft: spawn.behavior.pattern.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/spawn.behavior.pattern.handler.ts`

**Gap (feature 12):** Alarm-driven spawn path not shipped. **14** calls on `behavior_pattern_detection` case.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { BehaviorPatternAgent } from '@/agents/brain/_subagents/behavior-pattern/behavior.pattern.agent'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'

type SpawnBehaviorPatternInput = {
	userId: string
}

export async function spawnBehaviorPattern(
	brain: BrioelaBrain,
	database: BrainDatabase,
	input: SpawnBehaviorPatternInput,
	wake?: AlarmWakeCallbacks,
): Promise<void> {
	const runId = createId()

	// insertUserSession background row — alarmType: behavior_pattern_detection

	const patternAgent = await brain.subAgent(
		BehaviorPatternAgent,
		`behavior-pattern-${input.userId}-${runId}`,
	)

	const outcome = await patternAgent.runBehaviorPatternPass({ userId: input.userId, runId })

	// Finalize session row with outcome.summary, tokens

	if (wake && outcome.status === 'completed') {
		// refresh wake slot
	}
}
```

**Note:** `behavior_pattern_detection.last_run` updated inside pass handler on success only — not on defer.
