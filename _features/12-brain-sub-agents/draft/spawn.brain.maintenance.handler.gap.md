# Draft: spawn.brain.maintenance.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/spawn.brain.maintenance.handler.ts`

**Gap (feature 12):** Alarm-driven spawn path not shipped. **14** `dispatch.alarm.handler.ts` calls this on `brain_maintenance_run` case.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { sql } from 'drizzle-orm'
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { BrainMaintenanceAgent } from '@/agents/brain/_subagents/brain-maintenance/brain.maintenance.agent'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { readCurrentEpochMs } from '@/time/_helpers'

type SpawnBrainMaintenanceInput = {
	userId: string
}

export async function spawnBrainMaintenance(
	brain: BrioelaBrain,
	database: BrainDatabase,
	input: SpawnBrainMaintenanceInput,
	wake?: AlarmWakeCallbacks,
): Promise<void> {
	const runId = createId()
	const now = readCurrentEpochMs()

	// Background session row — uses **11** insert helper when shipped
	// insertUserSession({ sessionType: 'background', alarmType: 'brain_maintenance_run', ... })

	const maintenance = await brain.subAgent(
		BrainMaintenanceAgent,
		`brain-maintenance-${input.userId}-${runId}`,
	)

	const outcome = await maintenance.runMaintenancePass({ userId: input.userId, runId })

	// Finalize session: status completed, outcome_summary, tokens

	if (outcome.status === 'completed') {
		const checkpoint = database.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`)
		// Log brain_maintenance.last_checkpoint to agent_state

		await brain.setAgentState({
			key: 'brain_maintenance.last_run',
			value: String(now),
		})
	}

	if (wake) {
		// readEarliestPendingScheduledAt → wake.scheduleAlarm
	}
}
```

**WAL step:** per `implementable-specs/12-schema-version.md` — only after successful maintenance pass.
