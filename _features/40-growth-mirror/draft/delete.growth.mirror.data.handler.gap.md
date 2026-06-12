# Draft: delete.growth.mirror.data.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/growth-mirror/delete.growth.mirror.data.handler.ts`

**Gap:** No privacy category delete for "cooking progress" per spec **53** / spec **34**.

**Source:** `brioela-specs/53-growth-mirror.md` § Privacy

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { skillTrajectory } from '@/agents/brain/_schemas/skill.trajectory.schema'
import { growthRecognition } from '@/agents/brain/_schemas/growth.recognition.schema'
import { memoryEvent } from '@/agents/brain/_schemas/memory.event.schema'
import { eq, and } from 'drizzle-orm'
import { MEMORY_EVENT_KIND_SKILL_EVIDENCE } from '@brioela/shared/validator/growth-mirror/skill.evidence.payload.schema'

export type DeleteGrowthMirrorDataResult = {
	trajectoriesDeleted: number
	recognitionsDeleted: number
	evidenceDeleted: number
}

export async function deleteGrowthMirrorData(
	db: BrainDatabase,
	userId: string,
	options: { deleteEvidence?: boolean } = {},
): Promise<DeleteGrowthMirrorDataResult> {
	const trajectories = await db
		.delete(skillTrajectory)
		.where(eq(skillTrajectory.userId, userId))
		.returning()

	const recognitions = await db
		.delete(growthRecognition)
		.where(eq(growthRecognition.userId, userId))
		.returning()

	let evidenceDeleted = 0
	if (options.deleteEvidence) {
		const evidence = await db
			.delete(memoryEvent)
			.where(
				and(
					eq(memoryEvent.userId, userId),
					eq(memoryEvent.kind, MEMORY_EVENT_KIND_SKILL_EVIDENCE),
				),
			)
			.returning()
		evidenceDeleted = evidence.length
	}

	return {
		trajectoriesDeleted: trajectories.length,
		recognitionsDeleted: recognitions.length,
		evidenceDeleted,
	}
}
```
