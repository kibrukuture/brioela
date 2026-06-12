# Draft: build.alarm.wake.callbacks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/build.alarm.wake.callbacks.helper.ts`

**Gap (feature 20):** Construct `AlarmWakeCallbacks` on `BrioelaBrain` so **19** alarm tools register in live sessions.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { readEarliestPendingScheduledAt } from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { BrainDatabase } from '@/agents/brain/_database'

export function buildAlarmWakeCallbacks(
	ctx: DurableObjectState,
	database: BrainDatabase,
	userId: string,
): AlarmWakeCallbacks {
	return {
		scheduleAlarm: async (scheduledAtMs: number) => {
			await ctx.storage.setAlarm(scheduledAtMs)
		},
		cancelAlarm: async () => {
			const next = readEarliestPendingScheduledAt(database, userId)
			if (next === null) {
				await ctx.storage.deleteAlarm()
				return
			}
			await ctx.storage.setAlarm(next.scheduledAt)
		},
	}
}
```

Per **09** contract: tool executables write SQLite first, then call these callbacks to refresh MIN-pending DO slot. **14** may extend with Agents SDK `schedule()` — reconcile at ship.
