import { and, eq, getOne } from '@/database/drizzle/_database'
import { recipes } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function readUserRecipe(database: BrainDatabase, id: string) {
	return getOne(
		database
			.select()
			.from(recipes)
			.where(eq(recipes.id, id)),
	)
}

export function readActiveUserRecipe(database: BrainDatabase, id: string) {
	return getOne(
		database
			.select()
			.from(recipes)
			.where(
				and(
					eq(recipes.id, id),
					eq(recipes.status, 'active'),
				),
			),
	)
}
