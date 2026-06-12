# Draft: load.growth.mirror.context.for.mira.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/growth-mirror/load.growth.mirror.context.for.mira.handler.ts`

**Gap:** No Brain RPC returning recognition candidate + demonstrated-skill summary for Mira scene build.

**Source:** `build-guide/40-growth-mirror/03-recognition-budget.md`, `04-recipe-confidence-touch.md`

**Called from:** **29** `buildCookingMiraScene` / recipe open path.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { surfaceGrowthRecognition } from '@/agents/brain/_helpers/growth-mirror/surface.growth.recognition.helper'
import { buildDemonstratedSkillSummary } from '@/agents/brain/_helpers/growth-mirror/build.demonstrated.skill.summary.helper'
import { buildOnDemandSkillAnswer } from '@/agents/brain/_helpers/growth-mirror/build.on.demand.skill.answer.helper'

export type LoadGrowthMirrorContextInput = {
	userId: string
	sessionId?: string
	recipeId?: string
	recipeTechniques?: string[]
	recipeDifficulty?: number
	onDemandQuestion?: string
}

export type GrowthMirrorMiraContext = {
	pendingRecognition?: {
		headline: string
		dimension: string
		evidenceRefs: string[]
	}
	demonstratedSkill?: Awaited<ReturnType<typeof buildDemonstratedSkillSummary>>
	onDemandAnswer?: string
}

export async function loadGrowthMirrorContextForMira(
	db: BrainDatabase,
	input: LoadGrowthMirrorContextInput,
): Promise<GrowthMirrorMiraContext> {
	const context: GrowthMirrorMiraContext = {}

	if (input.onDemandQuestion?.toLowerCase().includes('getting better')) {
		context.onDemandAnswer = await buildOnDemandSkillAnswer(db, input.userId)
		return context
	}

	if (input.recipeId && input.recipeTechniques && input.recipeDifficulty !== undefined) {
		context.demonstratedSkill = await buildDemonstratedSkillSummary(db, {
			userId: input.userId,
			recipeId: input.recipeId,
			techniques: input.recipeTechniques,
			difficulty: input.recipeDifficulty,
		})
	}

	if (input.sessionId) {
		const surfaced = await surfaceGrowthRecognition(
			db,
			input.userId,
			input.recipeId ? 'recipe_open' : 'session_end',
			input.sessionId,
		)
		if (surfaced) {
			context.pendingRecognition = {
				headline: surfaced.headline,
				dimension: surfaced.dimension,
				evidenceRefs: surfaced.evidenceRefs,
			}
		}
	}

	return context
}
```
