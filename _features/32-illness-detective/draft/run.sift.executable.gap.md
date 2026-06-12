# Draft: run.sift.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/sift/run.sift.executable.ts`

**Gap (feature 32):** End-to-end Sift orchestration — report, context, rank, persist, schedule follow-up.

---

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { AppContext } from '@/types'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { RunSiftInput } from '@/agents/brain/_tools/_schemas/run.sift.schema'
import { illnessReports } from '@/agents/brain/_schemas/illness.report.schema'
import { illnessSuspects } from '@/agents/brain/_schemas/illness.suspect.schema'
import { computeLookbackWindow } from '@/agents/brain/_handlers/sift/compute.lookback.window.helper'
import { buildSiftContext } from '@/agents/brain/_handlers/sift/build.sift.context.helper'
import { rankSiftSuspects } from '@/agents/brain/_handlers/sift/rank.sift.suspects.handler'
import { scheduleSiftFollowup } from '@/agents/brain/_handlers/sift/schedule.sift.followup.helper'

export type RunSiftResult = {
	reportId: string
	suspects: Array<{
		rank: number
		suspectType: string
		suspectId: string
		confidenceScore: number
		reasonText: string
		recallActive: boolean
	}>
	safetySummary: string
}

export async function runSiftExecutable(
	database: BrainDatabase,
	brain: BrioelaBrain,
	ctx: AppContext,
	userId: string,
	input: RunSiftInput,
): Promise<RunSiftResult> {
	const now = readCurrentEpochMs()
	const window = computeLookbackWindow(input.symptomOnsetHours)
	const reportId = input.reportId ?? createId()

	if (!input.reportId) {
		await database.insert(illnessReports).values({
			id: reportId,
			userId,
			symptomOnsetAt: now - input.symptomOnsetHours * 60 * 60 * 1000,
			reportedAt: now,
			windowStart: window.windowStart,
			windowEnd: window.windowEnd,
			status: 'open',
			createdAt: now,
			updatedAt: now,
		})
	}

	const siftContext = await buildSiftContext(database, ctx, userId, window)
	const ranked = await rankSiftSuspects(siftContext, brain.getStructuredModel())

	await database.delete(illnessSuspects).where(eq(illnessSuspects.reportId, reportId))

	for (let i = 0; i < ranked.suspects.length; i++) {
		const s = ranked.suspects[i]
		await database.insert(illnessSuspects).values({
			id: createId(),
			reportId,
			suspectType: s.suspectType,
			suspectId: s.suspectId,
			confidenceScore: s.confidenceScore,
			reasonCode: s.reasonCode,
			reasonText: s.reasonText,
			rank: i + 1,
			recallActive: s.recallActive,
			createdAt: now,
		})
	}

	await scheduleSiftFollowup(database, brain, userId, {
		reportId,
		symptomOnsetHours: input.symptomOnsetHours,
	})

	return {
		reportId,
		suspects: ranked.suspects.map((s, idx) => ({
			rank: idx + 1,
			suspectType: s.suspectType,
			suspectId: s.suspectId,
			confidenceScore: s.confidenceScore,
			reasonText: s.reasonText,
			recallActive: s.recallActive,
		})),
		safetySummary: ranked.safetySummary,
	}
}

import { eq } from 'drizzle-orm'
```

Also write `sickness_logged` via **05** `log_memory_event` after successful rank.
