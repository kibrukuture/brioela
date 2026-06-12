# Draft: adapt.encore.constraints.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/adapt.encore.constraints.helper.ts`

**Gap (feature 48):** Workflow step 4 — attributed constraint substitutions.

**Source:** `build-guide/31-encore/03-constraint-adaptation-and-sourcing.md`

```typescript
import type { NormalizedRecipeContent } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import type { EncoreReconstructionResult } from './reconstruct.encore.recipe.helper'

export type ConstraintAdaptationNote = {
	fieldPath: string
	attribution: string
	originalValue?: string
}

export type AdaptedEncoreRecipe = EncoreReconstructionResult & {
	adaptationNotes: ConstraintAdaptationNote[]
}

export async function adaptEncoreConstraints(
	env: Cloudflare.Env,
	userId: string,
	reconstruction: EncoreReconstructionResult,
): Promise<AdaptedEncoreRecipe> {
	const constraints = await loadConfirmedConstraints(env, userId)
	const adaptationNotes: ConstraintAdaptationNote[] = []

	let recipe: NormalizedRecipeContent = reconstruction.recipe

	for (const allergen of constraints.hardAllergens) {
		const substitution = substituteAllergenIngredient(recipe, allergen)
		if (substitution) {
			recipe = substitution.recipe
			adaptationNotes.push({
				fieldPath: substitution.fieldPath,
				attribution: `swapped for your allergy (${allergen})`,
				originalValue: substitution.originalValue,
			})
		}
	}

	// TODO(23): medical condition rules with "reduced for your condition" attribution

	return {
		...reconstruction,
		recipe,
		adaptationNotes,
	}
}

async function loadConfirmedConstraints(_env: Cloudflare.Env, _userId: string) {
	return { hardAllergens: [] as string[] }
}

function substituteAllergenIngredient(
	recipe: NormalizedRecipeContent,
	_allergen: string,
): { recipe: NormalizedRecipeContent; fieldPath: string; originalValue: string } | null {
	return null
}
```
