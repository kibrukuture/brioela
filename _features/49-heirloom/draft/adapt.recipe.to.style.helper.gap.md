# Draft: adapt.recipe.to.style.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/cook.style/adapt.recipe.to.style.helper.ts`

**Target latency:** <3s per spec **32**.

---

```typescript
import { createId } from '@brioela/shared/id'
import type { NormalizedRecipeContent } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { cookStyleProfiles } from '@/agents/brain/_schemas/cook.style.profile.schema'
import { cookStyleAttributes } from '@/agents/brain/_schemas/cook.style.attribute.schema'
import { recipeStyleVariants } from '@/agents/brain/_schemas/recipe.style.variant.schema'
import { readUserRecipe } from '@/agents/brain/_repositories/read.user.recipe.repository'
import { eq } from 'drizzle-orm'

export async function adaptRecipeToStyleHelper(
	db: BrainDatabase,
	env: Cloudflare.Env,
	recipeId: string,
	profileId: string,
): Promise<{ variantId: string; adaptationNotes: string }> {
	const recipe = await readUserRecipe(db, recipeId)
	if (!recipe) throw new Error('recipe_not_found')

	const profile = await db
		.select()
		.from(cookStyleProfiles)
		.where(eq(cookStyleProfiles.id, profileId))
		.get()
	if (!profile) throw new Error('profile_not_found')

	const attributes = await db
		.select()
		.from(cookStyleAttributes)
		.where(eq(cookStyleAttributes.profileId, profileId))
		.all()

	const adapted = await runStyleAdaptationLlm(env, {
		recipe: recipe.content as NormalizedRecipeContent,
		profileSummary: profile.styleSummaryText,
		attributes,
	})

	const variantId = createId()
	const now = Date.now()

	await db.insert(recipeStyleVariants).values({
		id: variantId,
		recipeId,
		profileId,
		adaptedRecipeJson: JSON.stringify(adapted.content),
		adaptationNotes: adapted.notes,
		createdAt: now,
	})

	return { variantId, adaptationNotes: adapted.notes }
}

async function runStyleAdaptationLlm(
	_env: Cloudflare.Env,
	_input: {
		recipe: NormalizedRecipeContent
		profileSummary: string
		attributes: (typeof cookStyleAttributes.$inferSelect)[]
	},
): Promise<{ content: NormalizedRecipeContent; notes: string }> {
	throw new Error('not implemented')
}
```
