import { runInDurableObject } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { createDatabase } from '@/agents/brain/_database'
import { writeUserRecipe } from '@/agents/brain/_repositories'
import { recipeVersions, recipes } from '@/agents/brain/_schemas'
import type { NormalizedRecipeContent } from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import { archiveUserRecipeExecutable } from '@/agents/brain/_tools/_executables/archive.user.recipe.executable'
import { updateUserRecipeExecutable } from '@/agents/brain/_tools/_executables/update.user.recipe.executable'
import { viewUserRecipeExecutable } from '@/agents/brain/_tools/_executables/view.user.recipe.executable'
import { archiveUserRecipeTool } from '@/agents/brain/_tools/archive.user.recipe.tool'
import { buildToolsForSession } from '@/agents/brain/_tools/memory.tool'
import { updateUserRecipeTool } from '@/agents/brain/_tools/update.user.recipe.tool'
import { viewUserRecipeTool } from '@/agents/brain/_tools/view.user.recipe.tool'
import { and, eq } from '@/database/drizzle/_database'

const recipeId = '00000000-0000-4000-8000-000000000001'
const userId = 'user-recipe-test'

function sampleRecipe(overrides: Partial<NormalizedRecipeContent> = {}): NormalizedRecipeContent {
	return {
		title: "Grandma's Doro Wat",
		attribution: {
			title: null,
			authorName: null,
			canonicalUrl: null,
		},
		servings: { value: 4, confidence: 1 },
		totalTimeMinutes: { value: 120, confidence: 0.9 },
		ingredients: [
			{
				name: 'chicken',
				quantityText: '1 whole',
				unit: null,
				preparation: null,
				optional: false,
				estimated: false,
				confidence: 1,
			},
			{
				name: 'berbere',
				quantityText: '3 tbsp',
				unit: null,
				preparation: null,
				optional: false,
				estimated: false,
				confidence: 1,
			},
		],
		steps: [
			{
				order: 1,
				instruction: 'Marinate the chicken overnight.',
				durationMinutes: null,
				temperatureText: null,
				confidence: 1,
			},
			{
				order: 2,
				instruction: 'Simmer slowly until tender.',
				durationMinutes: 90,
				temperatureText: null,
				confidence: 1,
			},
		],
		cuisine: 'ethiopian',
		difficulty: 'medium',
		tags: ['ethiopian', 'poultry'],
		confidence: 1,
		warnings: [],
		...overrides,
	}
}

function seedActiveRecipe(
	database: ReturnType<typeof createDatabase>,
	content: NormalizedRecipeContent = sampleRecipe(),
) {
	const now = 1_700_000_000_000
	return writeUserRecipe(database, {
		id: recipeId,
		userId,
		title: content.title,
		origin: 'cooking_session',
		sessionId: null,
		linkUrl: null,
		content: JSON.stringify(content),
		version: 1,
		cookCount: 2,
		lastCookedAt: now - 86_400_000,
		status: 'active',
		confidence: 1,
		createdAt: now - 604_800_000,
		updatedAt: now - 86_400_000,
	})
}

describe('Brain Recipe Tools', () => {
	it('exposes recipe tools by session kind', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, (_, state) => {
			const database = createDatabase(state.storage)
			const cookingTools = buildToolsForSession(database, userId, 'cooking')
			const chatTools = buildToolsForSession(database, userId, 'chat')
			const alarmTools = buildToolsForSession(database, userId, 'alarm')

			expect(cookingTools.view_user_recipe).toBeDefined()
			expect(cookingTools.update_user_recipe).toBeDefined()
			expect(cookingTools.archive_user_recipe).toBeDefined()
			expect(chatTools.view_user_recipe).toBeDefined()
			expect(chatTools.update_user_recipe).toBeUndefined()
			expect(alarmTools.view_user_recipe).toBeUndefined()
		})
	})

	it('view_user_recipe returns parsed content and ingredient_names for active recipes', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			expect(viewUserRecipeTool(database)).toBeDefined()
			seedActiveRecipe(database)

			const result = await viewUserRecipeExecutable(database, { id: recipeId })

			expect(result.found).toBe(true)
			if (!result.found) {
				throw new Error('expected active recipe')
			}
			expect(result.title).toBe("Grandma's Doro Wat")
			expect(result.version).toBe(1)
			expect(result.ingredient_names).toEqual(['chicken', 'berbere'])
			expect(result.content.title).toBe("Grandma's Doro Wat")
			expect(result.cook_count).toBe(2)
		})
	})

	it('view_user_recipe returns found false for archived recipes', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			seedActiveRecipe(database)
			await archiveUserRecipeExecutable(database, {
				id: recipeId,
				reason: 'User no longer cooks this variant.',
			})

			const result = await viewUserRecipeExecutable(database, { id: recipeId })
			expect(result).toEqual({
				found: false,
				id: recipeId,
				hint: 'Recipe not found or archived. Check the recipe index for available recipes.',
			})
		})
	})

	it('update_user_recipe archives recipe_versions and increments version with title sync', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			expect(updateUserRecipeTool(database, userId)).toBeDefined()
			seedActiveRecipe(database)

			const updatedContent = sampleRecipe({
				title: "Grandma's Doro Wat (extra berbere)",
				ingredients: [
					...sampleRecipe().ingredients,
					{
						name: 'niter kibbeh',
						quantityText: '4 tbsp',
						unit: null,
						preparation: null,
						optional: false,
						estimated: false,
						confidence: 1,
					},
				],
			})

			const result = await updateUserRecipeExecutable(database, userId, {
				id: recipeId,
				content: JSON.stringify(updatedContent),
				reason: 'Grandma said to add more berbere and niter kibbeh.',
				updated_by: 'agent',
			})

			expect(result).toMatchObject({
				id: recipeId,
				title: "Grandma's Doro Wat (extra berbere)",
				previous_version: 1,
				new_version: 2,
				archived: true,
				status: 'updated',
			})

			const liveRow = database
				.select()
				.from(recipes)
				.where(eq(recipes.id, recipeId))
				.get()
			expect(liveRow?.version).toBe(2)
			expect(liveRow?.title).toBe("Grandma's Doro Wat (extra berbere)")

			const archiveRow = database
				.select()
				.from(recipeVersions)
				.where(
					and(
						eq(recipeVersions.recipeId, recipeId),
						eq(recipeVersions.version, 1),
					),
				)
				.get()
			expect(archiveRow).toBeDefined()
			expect(archiveRow?.updateReason).toBe('Grandma said to add more berbere and niter kibbeh.')
			expect(JSON.parse(archiveRow?.content ?? '{}').title).toBe("Grandma's Doro Wat")
		})
	})

	it('update_user_recipe rejects archived recipes', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			seedActiveRecipe(database)
			await archiveUserRecipeExecutable(database, {
				id: recipeId,
				reason: 'Superseded by canonical version.',
			})

			const result = await updateUserRecipeExecutable(database, userId, {
				id: recipeId,
				content: JSON.stringify(sampleRecipe({ title: 'Should not apply' })),
				reason: 'Attempted update after archive.',
				updated_by: 'agent',
			})

			expect(result.error).toBe('recipe_not_found_or_archived')
		})
	})

	it('archive_user_recipe soft-deletes and rejects already archived recipes', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			expect(archiveUserRecipeTool(database)).toBeDefined()
			seedActiveRecipe(database)

			const archived = await archiveUserRecipeExecutable(database, {
				id: recipeId,
				reason: 'User confirmed they no longer make this.',
			})

			expect(archived).toMatchObject({
				id: recipeId,
				title: "Grandma's Doro Wat",
				status: 'archived',
				cook_count: 2,
			})

			const row = database
				.select()
				.from(recipes)
				.where(eq(recipes.id, recipeId))
				.get()
			expect(row?.status).toBe('archived')

			const again = await archiveUserRecipeExecutable(database, {
				id: recipeId,
				reason: 'Duplicate archive attempt.',
			})
			expect(again.error).toBe('already_archived')
		})
	})
})
