# Draft: dispatch.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/dispatch.alarm.handler.ts`

**Gap (feature 14):** Central alarm router not implemented. Ledger `06-alarm-system/0001` open.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import { handleSessionWatchdog } from '@/agents/brain/_handlers/session.watchdog.handler'
import { spawnBrainMaintenance } from '@/agents/brain/_handlers/spawn.brain.maintenance.handler'
import { spawnBehaviorPattern } from '@/agents/brain/_handlers/spawn.behavior.pattern.handler'
import { handleSicknessFollowup } from '@/agents/brain/_handlers/handle.sickness.followup.handler'
import { handleTravelPreload } from '@/agents/brain/_handlers/handle.travel.preload.handler'
import { handleMedicationReminder } from '@/agents/brain/_handlers/handle.medication.reminder.handler'
import { handleWeeklyFoodSummary } from '@/agents/brain/_handlers/handle.weekly.food.summary.handler'
import { handleScanFollowup } from '@/agents/brain/_handlers/handle.scan.followup.handler'
import { handleCookingTimerAudit } from '@/agents/brain/_handlers/handle.cooking.timer.audit.handler'
import { spawnHealthInsight } from '@/agents/brain/_handlers/spawn.health.insight.handler'

export async function dispatchAlarm(
	database: BrainDatabase,
	brain: BrioelaBrain,
	alarm: BrainScheduledAlarm,
	wake: AlarmWakeCallbacks,
): Promise<void> {
	const payload = JSON.parse(alarm.payload) as Record<string, unknown>

	switch (alarm.alarmType) {
		case 'session_watchdog':
			await handleSessionWatchdog(database, brain, alarm, payload, wake)
			return

		case 'brain_maintenance_run':
			await spawnBrainMaintenance(database, brain, alarm.userId, wake)
			return

		case 'behavior_pattern_detection':
			await spawnBehaviorPattern(database, brain, alarm.userId, wake)
			return

		case 'health_insight_run':
			await spawnHealthInsight(database, brain, alarm.userId, wake)
			return

		case 'sickness_followup':
			await handleSicknessFollowup(database, brain, alarm, payload)
			return

		case 'travel_preload':
			await handleTravelPreload(database, brain, alarm, payload)
			return

		case 'medication_reminder':
			await handleMedicationReminder(database, brain, alarm, payload, brain.env)
			return

		case 'weekly_food_summary':
			await handleWeeklyFoodSummary(database, brain, alarm.userId, wake)
			return

		case 'scan_followup':
			await handleScanFollowup(database, brain, alarm, payload)
			return

		case 'cooking_timer':
			await handleCookingTimerAudit(database, alarm, payload)
			return

		// recall_check: Path B — NOT scheduled_alarms. See 31-recall-alerts. Do not add case.

		default:
			throw new Error(`unknown_alarm_type:${alarm.alarmType}`)
	}
}
```

**Note:** `recall_check` intentionally absent per `implementable-specs/10-scheduled-alarms.md`. Build-guide case is obsolete.

**Spawn imports:** **12** / **22** handlers may not exist yet — **14** ships router first; integration tests mock spawns until **12** lands.
