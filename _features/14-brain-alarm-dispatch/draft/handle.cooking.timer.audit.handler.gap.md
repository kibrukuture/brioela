# Draft: handle.cooking.timer.audit.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/handle.cooking.timer.audit.handler.ts`

**Gap (feature 14 G17 + 09 G9):** Mira owns timer fire; Brain may receive audit mirror rows with legacy payload shape.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'
import { readCurrentEpochMs } from '@/time/_helpers'

/**
 * cooking_timer fires in MiraSession (fireCookingTimer). Brain row is audit-only.
 * See build-guide/08-cooking-session/05-timers.md — waitUntil mirror to schedule_user_alarm.
 * Payload mismatch: mirror may send alarm_id/fires_at vs tool alarm_type/scheduled_at (09 G9).
 */
export async function handleCookingTimerAudit(
	_database: BrainDatabase,
	alarm: BrainScheduledAlarm,
	_payload: Record<string, unknown>,
): Promise<void> {
	// No-op: timer already fired in Mira. Mark completed without side effects.
	// Optional: write action_outcome_json { source: 'mira_audit', synced_at: now }
	void alarm
	void readCurrentEpochMs()
}
```

**Reconciliation:** **29** should align mirror payload with **09** tool schema or stop writing Brain rows for timers.
