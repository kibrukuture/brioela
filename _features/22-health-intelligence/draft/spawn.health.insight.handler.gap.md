# Draft: spawn.health.insight.handler.ts (gap)

Target: `backend/src/agents/brain/_handlers/spawn.health.insight.handler.ts`

**Owner:** **22**. Called from **14** `dispatchAlarm` `health_insight_run` case.

Source: `03-health-insight-agent.md`, **12** `spawn.brain.maintenance.handler` pattern.

```typescript
import type { BrioelaBrain, BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { readCurrentEpochMs } from '@/time/_helpers'

export async function spawnHealthInsight(
	database: BrainDatabase,
	brain: BrioelaBrain,
	userId: string,
	wake: AlarmWakeCallbacks,
	env: BrioelaBrainEnv,
): Promise<void> {
	const runId = crypto.randomUUID()
	const now = readCurrentEpochMs()

	// 1. check_active_session — defer 1h if active (same as maintenance agents)
	const hasActive = await brain.checkActiveSession({ userId })
	if (hasActive) {
		// schedule_user_alarm health_insight_run now + 1h
		return
	}

	// 2. Insert sessions row: session_type background, alarm_type health_insight_run
	const sessionId = crypto.randomUUID()
	// openBackgroundSession(...)

	// 3. subAgent(HealthInsightAgent, `health_${userId}_${runId}`)
	// 4. runHealthInsightPass({ userId, runId })
	// 5. Finalize session — outcome_summary, tokens
	// 6. Write action_outcome_* on firing alarm row if applicable
	// 7. schedule_user_alarm next health_insight_run (now + 7 days, asleep-time adjustment)
}
```

Blocked by **12** G1 (no `_subagents/`), **14** G (no dispatch router).
