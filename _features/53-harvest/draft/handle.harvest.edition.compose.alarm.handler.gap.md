# Draft: handle.harvest.edition.compose.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/alarms/handle.harvest.edition.compose.alarm.handler.ts`

**Gap (feature 53):** Alarm dispatch entry — week before anniversary.

**Source:** `build-guide/36-harvest/01-composition-workflow.md` § Trigger; **14** alarm dispatch

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { composeHarvestEdition } from '@/agents/brain/_handlers/harvest/compose.harvest.edition.handler'
import { computeAnniversaryWindow } from '@/agents/brain/_helpers/harvest/compute.anniversary.window.helper'

export type HarvestEditionComposeAlarmPayload = {
	accountCreatedAt: number
}

export async function handleHarvestEditionComposeAlarm(
	db: BrainDatabase,
	userId: string,
	payload: HarvestEditionComposeAlarmPayload,
): Promise<void> {
	const window = computeAnniversaryWindow(payload.accountCreatedAt)
	if (!window) {
		return
	}

	const msUntilAnniversary = window.periodEnd - Date.now()
	const oneWeekMs = 7 * 86_400_000

	if (msUntilAnniversary > oneWeekMs || msUntilAnniversary < 0) {
		return
	}

	await composeHarvestEdition(db, userId, payload.accountCreatedAt)
}
```
