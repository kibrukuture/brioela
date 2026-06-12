# Draft: dispatch.alarm.handler.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/dispatch.alarm.handler.test.ts`

**Gap (feature 14 G24):** No dispatch tests in backend.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, it, vi } from 'vitest'
import { dispatchAlarm } from '@/agents/brain/_handlers/dispatch.alarm.handler'
import { handleSessionWatchdog } from '@/agents/brain/_handlers/session.watchdog.handler'
import { spawnBrainMaintenance } from '@/agents/brain/_handlers/spawn.brain.maintenance.handler'

vi.mock('@/agents/brain/_handlers/session.watchdog.handler', () => ({
	handleSessionWatchdog: vi.fn(),
}))
vi.mock('@/agents/brain/_handlers/spawn.brain.maintenance.handler', () => ({
	spawnBrainMaintenance: vi.fn(),
}))
vi.mock('@/agents/brain/_handlers/spawn.behavior.pattern.handler', () => ({
	spawnBehaviorPattern: vi.fn(),
}))

const wake = {
	scheduleAlarm: vi.fn(async () => undefined),
	cancelAlarm: vi.fn(async () => undefined),
}

describe('dispatchAlarm', () => {
	it('routes session_watchdog to handleSessionWatchdog', async () => {
		const alarm = {
			id: 'a1',
			userId: 'u1',
			alarmType: 'session_watchdog',
			payload: JSON.stringify({ session_id: 's1' }),
		}

		await dispatchAlarm({} as never, {} as never, alarm as never, wake)

		expect(handleSessionWatchdog).toHaveBeenCalled()
	})

	it('routes brain_maintenance_run to spawnBrainMaintenance', async () => {
		const alarm = {
			id: 'a2',
			userId: 'u1',
			alarmType: 'brain_maintenance_run',
			payload: '{}',
		}

		await dispatchAlarm({} as never, {} as never, alarm as never, wake)

		expect(spawnBrainMaintenance).toHaveBeenCalled()
	})

	it('throws on unknown alarm_type', async () => {
		const alarm = {
			id: 'a3',
			userId: 'u1',
			alarmType: 'unknown_type_xyz',
			payload: '{}',
		}

		await expect(
			dispatchAlarm({} as never, {} as never, alarm as never, wake),
		).rejects.toThrow('unknown_alarm_type')
	})
})
```

Run: `cd backend && bunx vitest run src/agents/brain/_handlers/dispatch.alarm.handler.test.ts`
