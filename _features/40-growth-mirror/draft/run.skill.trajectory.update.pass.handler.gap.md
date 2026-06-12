# Draft: run.skill.trajectory.update.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/growth-mirror/run.skill.trajectory.update.pass.handler.ts`

**Gap:** BrainMaintenanceAgent has no Pass 4 for trajectory maintenance.

**Source:** `build-guide/40-growth-mirror/02-trajectory-model.md`, `brioela-specs/53-growth-mirror.md` § How the Trajectory Builds

**Invoked from:** **12** `run.maintenance.pass.handler.ts` after Pass 3.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { countQualifyingCookingSessions } from '@/agents/brain/_helpers/growth-mirror/count.qualifying.cooking.sessions.helper'
import { loadSkillEvidenceSince } from '@/agents/brain/_helpers/growth-mirror/load.skill.evidence.since.helper'
import { computeTrajectoryDirection } from '@/agents/brain/_helpers/growth-mirror/compute.trajectory.direction.helper'
import { upsertSkillTrajectory } from '@/agents/brain/_helpers/growth-mirror/upsert.skill.trajectory.helper'
import { detectNotabilityThreshold } from '@/agents/brain/_helpers/growth-mirror/detect.notability.threshold.helper'
import { enqueueGrowthRecognitionCandidate } from '@/agents/brain/_helpers/growth-mirror/enqueue.growth.recognition.candidate.helper'
import { expireStaleRecognitionCandidates } from '@/agents/brain/_helpers/growth-mirror/expire.stale.recognition.candidates.helper'

const MIN_SESSIONS_OVERALL = 8
const MIN_EVENTS_PER_DIMENSION = 5

export type SkillTrajectoryPassResult = {
	dimensionsUpdated: number
	candidatesEnqueued: number
	candidatesExpired: number
	deferredReason?: 'insufficient_sessions'
}

export async function runSkillTrajectoryUpdatePass(
	db: BrainDatabase,
	userId: string,
	sinceTimestamp: number,
): Promise<SkillTrajectoryPassResult> {
	const sessionCount = await countQualifyingCookingSessions(db, userId)
	if (sessionCount < MIN_SESSIONS_OVERALL) {
		return {
			dimensionsUpdated: 0,
			candidatesEnqueued: 0,
			candidatesExpired: 0,
			deferredReason: 'insufficient_sessions',
		}
	}

	const expired = await expireStaleRecognitionCandidates(db, userId, 30)

	const evidenceByDimension = await loadSkillEvidenceSince(db, userId, sinceTimestamp)
	let dimensionsUpdated = 0
	let candidatesEnqueued = 0

	for (const [dimension, events] of Object.entries(evidenceByDimension)) {
		if (events.length < MIN_EVENTS_PER_DIMENSION) {
			await upsertSkillTrajectory(db, {
				userId,
				dimension,
				direction: 'insufficient_evidence',
				confidence: 0,
				evidenceRefs: events.map((e) => e.id),
				sessionsObserved: sessionCount,
			})
			dimensionsUpdated += 1
			continue
		}

		const computed = computeTrajectoryDirection(dimension, events)
		await upsertSkillTrajectory(db, {
			userId,
			dimension,
			direction: computed.direction,
			confidence: computed.confidence,
			evidenceRefs: computed.evidenceRefs,
			baselineNote: computed.baselineNote,
			latestNote: computed.latestNote,
			sessionsObserved: sessionCount,
		})
		dimensionsUpdated += 1

		const notability = detectNotabilityThreshold(dimension, events, computed)
		if (notability) {
			const enqueued = await enqueueGrowthRecognitionCandidate(db, {
				userId,
				dimension,
				headline: notability.headline,
				evidenceRefs: notability.evidenceRefs,
			})
			if (enqueued) candidatesEnqueued += 1
		}
	}

	return {
		dimensionsUpdated,
		candidatesEnqueued,
		candidatesExpired: expired,
	}
}
```
