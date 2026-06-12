# Draft: enqueue.growth.recognition.candidate.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/growth-mirror/enqueue.growth.recognition.candidate.helper.ts`

**Gap:** No `growth_recognition` candidate queue writes.

**Source:** `build-guide/40-growth-mirror/03-recognition-budget.md`

---

```typescript
import { createId } from '@/lib/create-id'
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { growthRecognition } from '@/agents/brain/_schemas/growth.recognition.schema'
import { eq, and } from 'drizzle-orm'

const BANNED_GENERIC_PHRASES = ['nice job', 'great work', 'well done', 'good job tonight']

export type EnqueueGrowthRecognitionInput = {
	userId: string
	dimension: string
	headline: string
	evidenceRefs: string[]
}

export async function enqueueGrowthRecognitionCandidate(
	db: BrainDatabase,
	input: EnqueueGrowthRecognitionInput,
): Promise<boolean> {
	const lower = input.headline.toLowerCase()
	if (BANNED_GENERIC_PHRASES.some((p) => lower.includes(p))) {
		return false
	}

	if (input.evidenceRefs.length === 0) {
		return false
	}

	const existing = await db
		.select()
		.from(growthRecognition)
		.where(
			and(
				eq(growthRecognition.userId, input.userId),
				eq(growthRecognition.dimension, input.dimension),
				eq(growthRecognition.status, 'candidate'),
			),
		)
		.get()

	if (existing) {
		return false
	}

	await db.insert(growthRecognition).values({
		recognitionId: createId(),
		userId: input.userId,
		dimension: input.dimension,
		headline: input.headline,
		evidenceRefsJson: JSON.stringify(input.evidenceRefs),
		status: 'candidate',
		surfacedIn: null,
		createdAt: Date.now(),
		surfacedAt: null,
	})

	return true
}
```
