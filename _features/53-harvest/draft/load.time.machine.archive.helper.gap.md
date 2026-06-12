# Draft: load.time.machine.archive.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/harvest/load.time.machine.archive.helper.ts`

**Gap (feature 53):** Read year's Time Machine candidates — surfaced or not.

**Source:** `brioela-specs/49-harvest.md` § Composition step 1; `build-guide/18-ambient-intelligence/04-food-time-machine.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { timeMachineMoments } from '@/agents/brain/_schemas/time.machine.moment.schema'
import { and, eq, gte, lte } from 'drizzle-orm'

export type TimeMachineArchiveEntry = {
	momentId: string
	momentType: string
	text: string
	salience: number
	surfacedAt: number | null
	createdAt: number
}

/**
 * Annual Harvest reads the full year's candidate archive from **35** Time Machine.
 * Inline weekly queue expiry does not delete historical rows used for compose.
 */
export async function loadTimeMachineArchive(
	db: BrainDatabase,
	userId: string,
	periodStart: number,
	periodEnd: number,
): Promise<TimeMachineArchiveEntry[]> {
	const rows = await db
		.select({
			momentId: timeMachineMoments.id,
			momentType: timeMachineMoments.momentType,
			text: timeMachineMoments.text,
			salience: timeMachineMoments.salience,
			surfacedAt: timeMachineMoments.surfacedAt,
			createdAt: timeMachineMoments.createdAt,
		})
		.from(timeMachineMoments)
		.where(
			and(
				eq(timeMachineMoments.userId, userId),
				gte(timeMachineMoments.createdAt, periodStart),
				lte(timeMachineMoments.createdAt, periodEnd),
			),
		)
		.all()

	return rows
}
```
