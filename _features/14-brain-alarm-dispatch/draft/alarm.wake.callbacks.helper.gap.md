# Draft: alarm.wake.callbacks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/alarm.wake.callbacks.helper.ts`

**Gap (feature 14 + 09 G1):** `BrioelaBrain` does not implement `AlarmWakeCallbacks`. Shared with **09** wake wiring.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'

/**
 * MIN-pending wake slot — matches implementable-specs/10-scheduled-alarms.md.
 * Alternative: per-row Agents SDK schedule() — see 09 G6 / 14 G6.
 */
export function createAlarmWakeCallbacks(brain: BrioelaBrain): AlarmWakeCallbacks {
	return {
		scheduleAlarm: async (scheduledAtMs: number) => {
			await brain.ctx.storage.setAlarm(scheduledAtMs)
		},
		cancelAlarm: async () => {
			await brain.ctx.storage.deleteAlarm()
		},
	}
}
```

**Wiring in `brioela.brain.agent.ts`:**

```typescript
async alarm(): Promise<void> {
	if (!this.readiness || this.readiness.status !== 'ready') return
	const wake = createAlarmWakeCallbacks(this)
	await processDueAlarms(this.database, this, this.userId, wake)
}
```

`userId` must be available on Brain instance (from DO name / state — **04** pattern).
