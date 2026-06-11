import { z } from '@brioela/shared/zod'

export const updateUserRecipeSchema = z.object({
	id: z.uuid().describe('Recipe UUID to update. Must be active.'),
	content: z.string().min(1).describe('NormalizedRecipeContent JSON string. Replaces content entirely.'),
	reason: z.string().min(1).describe('Why this recipe is being updated.'),
	updated_by: z.enum(['agent', 'brain_maintenance']).describe('Who is making this update.'),
})
