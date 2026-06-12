# Draft: load.craft.chapter.candidate.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/growth-mirror/load.craft.chapter.candidate.handler.ts`

**Gap:** Harvest **53** optional `craft` chapter has no growth-mirror arc reader.

**Source:** `build-guide/36-harvest/02-chapter-rules.md`, `build-guide/40-growth-mirror/04-recipe-confidence-touch.md` § Annual Handoff

**Note:** Harvest ships without this input per `_records/build-order/33-layer-harvest.md`.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { skillTrajectory } from '@/agents/brain/_schemas/skill.trajectory.schema'
import { eq } from 'drizzle-orm'

export type CraftChapterCandidate = {
	dimension: string
	direction: 'improving'
	confidence: number
	headlineSeed: string
	evidenceRefs: string[]
	sessionsObserved: number
}

export async function loadCraftChapterCandidate(
	db: BrainDatabase,
	userId: string,
	windowStart: number,
	windowEnd: number,
): Promise<CraftChapterCandidate | null> {
	const trajectories = await db
		.select()
		.from(skillTrajectory)
		.where(eq(skillTrajectory.userId, userId))
		.all()

	const improving = trajectories
		.filter((t) => t.direction === 'improving' && t.updatedAt >= windowStart && t.updatedAt <= windowEnd)
		.sort((a, b) => b.confidence - a.confidence)

	const strongest = improving[0]
	if (!strongest || strongest.confidence < 0.6) {
		return null
	}

	const evidenceRefs = JSON.parse(strongest.evidenceRefsJson) as string[]

	return {
		dimension: strongest.dimension,
		direction: 'improving',
		confidence: strongest.confidence,
		headlineSeed: strongest.latestNote ?? strongest.dimension,
		evidenceRefs,
		sessionsObserved: strongest.sessionsObserved,
	}
}
```
