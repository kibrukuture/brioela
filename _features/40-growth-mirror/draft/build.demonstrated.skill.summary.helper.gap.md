# Draft: build.demonstrated.skill.summary.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/growth-mirror/build.demonstrated.skill.summary.helper.ts`

**Gap:** Recipe-confidence touch — no demonstrated-skill summary for generative grammar / Mira.

**Source:** `build-guide/40-growth-mirror/04-recipe-confidence-touch.md`, `brioela-specs/39-generative-ui.md` § Recipe Cards

**Consumed by:** **52** recipe-card context assembly, **29** Mira cooking scene pre-brief.

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { skillTrajectory } from '@/agents/brain/_schemas/skill.trajectory.schema'
import { eq } from 'drizzle-orm'
import { mapRecipeTechniquesToDimensions } from './map.recipe.techniques.to.dimensions.helper'
import { classifyRecipeSkillGap } from './classify.recipe.skill.gap.helper'
import type { DemonstratedSkillSummary } from '@brioela/shared/validator/growth-mirror/demonstrated.skill.summary.schema'

export type RecipeSkillContextInput = {
	userId: string
	recipeId: string
	techniques: string[]
	difficulty: number
}

export async function buildDemonstratedSkillSummary(
	db: BrainDatabase,
	input: RecipeSkillContextInput,
): Promise<DemonstratedSkillSummary | null> {
	const trajectories = await db
		.select()
		.from(skillTrajectory)
		.where(eq(skillTrajectory.userId, input.userId))
		.all()

	if (trajectories.length === 0) {
		return null
	}

	const requiredDimensions = mapRecipeTechniquesToDimensions(input.techniques)
	const gap = classifyRecipeSkillGap(trajectories, requiredDimensions, input.difficulty)

	return {
		recipeId: input.recipeId,
		gapLevel: gap.level,
		masteredDimensions: gap.mastered,
		attentionStepOrder: gap.attentionStepOrder,
		familiarEnergy: gap.level === 'mastered',
		withinReach: gap.level === 'one_notch_up',
	}
}
```
