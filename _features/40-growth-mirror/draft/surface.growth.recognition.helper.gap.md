# Draft: surface.growth.recognition.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/growth-mirror/surface.growth.recognition.helper.ts`

**Gap:** No conversational delivery bundle for Mira at session end / recipe open.

**Source:** `build-guide/40-growth-mirror/03-recognition-budget.md`, `brioela-specs/53-growth-mirror.md` § User Outcome

**Never:** push notification, standalone card UI.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { growthRecognition } from '@/agents/brain/_schemas/growth.recognition.schema'
import { eq, and } from 'drizzle-orm'
import { checkGrowthInsightBudget } from './check.growth.insight.budget.helper'
import { markRecognitionSurfaced } from './mark.recognition.surfaced.helper'

export type GrowthRecognitionSurface = {
	recognitionId: string
	headline: string
	dimension: string
	evidenceRefs: string[]
	deliveryHint: 'session_end' | 'recipe_open' | 'mid_session'
}

export async function surfaceGrowthRecognition(
	db: BrainDatabase,
	userId: string,
	moment: GrowthRecognitionSurface['deliveryHint'],
	sessionRef: string,
): Promise<GrowthRecognitionSurface | null> {
	const budget = await checkGrowthInsightBudget(db, userId)
	if (!budget.allowed) {
		return null
	}

	const candidate = await db
		.select()
		.from(growthRecognition)
		.where(
			and(eq(growthRecognition.userId, userId), eq(growthRecognition.status, 'candidate')),
		)
		.orderBy(growthRecognition.createdAt)
		.get()

	if (!candidate) {
		return null
	}

	await markRecognitionSurfaced(db, {
		recognitionId: candidate.recognitionId,
		sessionRef,
	})

	return {
		recognitionId: candidate.recognitionId,
		headline: candidate.headline,
		dimension: candidate.dimension,
		evidenceRefs: JSON.parse(candidate.evidenceRefsJson) as string[],
		deliveryHint: moment,
	}
}
```
