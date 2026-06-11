import { z } from '@brioela/shared/zod'

export const viewUserRecipeSchema = z.object({
	id: z .uuid().describe('Recipe UUID from the session recipe index.'),
})
