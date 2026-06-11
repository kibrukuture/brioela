import type { BrainDatabase } from '@/agents/brain/_database'
import { readActiveUserRecipe } from '@/agents/brain/_repositories'
import {
	deriveIngredientNames,
	normalizedRecipeContentSchema,
} from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import type { viewUserRecipeSchema } from '@/agents/brain/_tools/_schemas/view.user.recipe.schema'
import type { z } from '@brioela/shared/zod'

export const viewUserRecipeExecutable = async (
	database: BrainDatabase,
	input: z.infer<typeof viewUserRecipeSchema>,
) => {
	const recipe = readActiveUserRecipe(database, input.id)
	if (!recipe) {
		return {
			found: false as const,
			id: input.id,
			hint: 'Recipe not found or archived. Check the recipe index for available recipes.',
		}
	}

	let parsedContent: unknown
	try {
		parsedContent = JSON.parse(recipe.content)
	} catch {
		return {
			found: false as const,
			id: input.id,
			hint: 'Recipe content is not valid JSON.',
		}
	}

	const validatedContent = normalizedRecipeContentSchema.safeParse(parsedContent)
	if (!validatedContent.success) {
		return {
			found: false as const,
			id: input.id,
			hint: 'Recipe content failed validation.',
		}
	}

	const content = validatedContent.data

	return {
		found: true as const,
		id: recipe.id,
		title: recipe.title,
		origin: recipe.origin,
		session_id: recipe.sessionId,
		link_url: recipe.linkUrl,
		cook_count: recipe.cookCount,
		last_cooked_at: recipe.lastCookedAt,
		status: recipe.status,
		confidence: recipe.confidence,
		version: recipe.version,
		content,
		ingredient_names: deriveIngredientNames(content),
	}
}
