import { tool } from 'ai'
import type { BrainDatabase } from '@/agents/brain/_database'
import { viewUserRecipeSchema } from '@/agents/brain/_tools/_schemas/view.user.recipe.schema'
import { viewUserRecipePrompt } from '@/agents/brain/_tools/_prompts/view.user.recipe.prompt'
import { viewUserRecipeExecutable } from '@/agents/brain/_tools/_executables/view.user.recipe.executable'

export const viewUserRecipeTool = (db: BrainDatabase) => tool({
	description: viewUserRecipePrompt,
	inputSchema: viewUserRecipeSchema,
	execute: async (params) => viewUserRecipeExecutable(db, params),
})
