import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { updateUserRecipeSchema } from '@/agents/brain/_tools/_schemas/update.user.recipe.schema'
import { updateUserRecipePrompt } from '@/agents/brain/_tools/_prompts/update.user.recipe.prompt'
import { updateUserRecipeExecutable } from '@/agents/brain/_tools/_executables/update.user.recipe.executable'

export const updateUserRecipeTool = (db: BrainDatabase, userId: string) => tool({
	description: updateUserRecipePrompt,
	inputSchema: updateUserRecipeSchema,
	execute: async (params) => updateUserRecipeExecutable(db, userId, params),
})
