# Draft: check.harvest.eligibility.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/check.harvest.eligibility.handler.ts`

**Gap (feature 53):** 10 active weeks floor + duplicate year guard.

**Source:** `build-guide/36-harvest/01-composition-workflow.md`, `02-chapter-rules.md` § Floors

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { harvestEditions } from '@/agents/brain/_schemas/harvest.edition.schema'
import { countActiveWeeksInWindow } from '@/agents/brain/_helpers/harvest/count.active.weeks.helper'
import { computeAnniversaryWindow } from '@/agents/brain/_helpers/harvest/compute.anniversary.window.helper'
import { and, eq } from 'drizzle-orm'

export type HarvestEligibilityResult =
	| { eligible: true; window: NonNullable<ReturnType<typeof computeAnniversaryWindow>> }
	| { eligible: false; reason: 'too_thin' | 'duplicate_year' | 'no_window' }

const MIN_ACTIVE_WEEKS = 10

export async function checkHarvestEligibility(
	db: BrainDatabase,
	userId: string,
	accountCreatedAt: number,
	now: number = Date.now(),
): Promise<HarvestEligibilityResult> {
	const window = computeAnniversaryWindow(accountCreatedAt, now)
	if (!window) {
		return { eligible: false, reason: 'no_window' }
	}

	const existing = await db
		.select({ editionId: harvestEditions.editionId })
		.from(harvestEditions)
		.where(
			and(eq(harvestEditions.userId, userId), eq(harvestEditions.yearIndex, window.yearIndex)),
		)
		.get()

	if (existing) {
		return { eligible: false, reason: 'duplicate_year' }
	}

	const activeWeeks = await countActiveWeeksInWindow(
		db,
		userId,
		window.periodStart,
		window.periodEnd,
	)

	if (activeWeeks < MIN_ACTIVE_WEEKS) {
		return { eligible: false, reason: 'too_thin' }
	}

	return { eligible: true, window }
}
```
