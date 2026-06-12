# Draft: brioela.brain.agent.ts alarm lifecycle (gap — partial file exists)

Target: `backend/src/agents/brain/brioela.brain.agent.ts`

**Gap (feature 14):** Shipped Brain has migrations + memory RPC only. No `alarm()`, no `runScheduledAlarm`, no wake callbacks, no init alarm seed call.

**Shipped today (excerpt):**

```typescript
export class BrioelaBrain extends Agent<BrioelaBrainEnv, BrioelaBrainState> {
	// ... migrations blockConcurrencyWhile only
	@callable() appendMemoryEvent(...) { ... }
	@callable() listMemoryEvents(...) { ... }
	@callable() checkReadiness(...) { ... }
}
```

---

## Intended additions (not yet in production)

```typescript
import { createAlarmWakeCallbacks } from '@/agents/brain/_helpers/alarm.wake.callbacks.helper'
import { processDueAlarms } from '@/agents/brain/_handlers/process.due.alarms.handler'
import { runScheduledAlarmById } from '@/agents/brain/_handlers/run.scheduled.alarm.handler'
import { initializeBrainSubAgentAlarms } from '@/agents/brain/_handlers/initialize.brain.sub.agent.alarms.handler'
import { readEarliestPendingScheduledAt } from '@/agents/brain/_repositories'

// Inside class after migration readiness:
private userId: string  // from DO name — set in constructor or onStart

async alarm(): Promise<void> {
	if (this.readiness?.status !== 'ready') return
	const wake = createAlarmWakeCallbacks(this)
	await processDueAlarms(this.database, this, this.userId, wake)
}

async runScheduledAlarm(payload: { scheduledAlarmId: string }): Promise<void> {
	if (this.readiness?.status !== 'ready') return
	const wake = createAlarmWakeCallbacks(this)
	await runScheduledAlarmById(this.database, this, this.userId, payload.scheduledAlarmId, wake)
}

// After do.initialized transition (12-schema-version step 3):
async function onBrainInitialized(database, userId, wake) {
	await initializeBrainSubAgentAlarms(database, userId, wake)
	const next = readEarliestPendingScheduledAt(database, userId)
	if (next) await wake.scheduleAlarm(next.scheduledAt)
}

getAlarmWakeCallbacks(): AlarmWakeCallbacks {
	return createAlarmWakeCallbacks(this)
}
```

**Do NOT seed `recall_check` here** — Path B per `10-scheduled-alarms.md` (14 G19).

**`initializeBrainSubAgentAlarms`:** owned by **12** — see `12-brain-sub-agents/draft/initialize.brain.sub.agent.alarms.gap.md`.
