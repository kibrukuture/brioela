import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { readUserRecipe, replaceUserRecipeContent } from '@/agents/brain/_repositories'
import { normalizedRecipeContentSchema } from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import type { updateUserRecipeSchema } from '@/agents/brain/_tools/_schemas/update.user.recipe.schema'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { z } from '@brioela/shared/zod'

export const updateUserRecipeExecutable = async (
	database: BrainDatabase,
	userId: string,
	input: z.infer<typeof updateUserRecipeSchema>,
) => {
	let parsedContent: unknown
	try {
		parsedContent = JSON.parse(input.content)
	} catch {
		return {
			error: 'invalid_json',
			id: input.id,
			hint: 'content must be valid JSON',
		}
	}

	const validatedContent = normalizedRecipeContentSchema.safeParse(parsedContent)
	if (!validatedContent.success) {
		return {
			error: 'invalid_content',
			id: input.id,
			hint: 'content must match NormalizedRecipeContent',
		}
	}

	const recipe = readUserRecipe(database, input.id)
	if (!recipe) {
		return {
			error: 'recipe_not_found_or_archived',
			id: input.id,
			hint: 'Recipe not found or archived. Only active recipes can be updated.',
		}
	}

	if (recipe.status === 'archived') {
		return {
			error: 'recipe_not_found_or_archived',
			id: input.id,
			hint: 'Recipe not found or archived. Only active recipes can be updated.',
		}
	}

	const content = validatedContent.data
	const now = readCurrentEpochMs()

	replaceUserRecipeContent(database, {
		recipeId: recipe.id,
		archive: {
			id: createId(),
			recipeId: recipe.id,
			userId,
			version: recipe.version,
			content: recipe.content,
			updatedBy: input.updated_by,
			updateReason: input.reason,
			archivedAt: now,
		},
		newContent: input.content,
		newTitle: content.title,
		newVersion: recipe.version + 1,
		updatedAt: now,
	})

	return {
		id: input.id,
		title: content.title,
		previous_version: recipe.version,
		new_version: recipe.version + 1,
		archived: true,
		status: 'updated' as const,
	}
}
