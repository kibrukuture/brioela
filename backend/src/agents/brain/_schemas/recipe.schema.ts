import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const recipeStatus = ['active', 'archived'] as const

export const recipes = sqliteTable(
	'recipes',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		title: text('title').notNull(),
		source: text('source').notNull(),
		sourceSessionId: text('source_session_id'),
		sourceUrl: text('source_url'),
		content: text('content').notNull(),
		cookCount: integer('cook_count', { mode: 'number' }).notNull().default(0),
		lastCookedAt: integer('last_cooked_at', { mode: 'number' }),
		status: text('status', { enum: recipeStatus }).notNull().default('active'),
		confidence: real('confidence').notNull().default(1.0),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('recipes_content_json_object_check', sql`json_valid(${table.content}) and json_type(${table.content}) = 'object'`),
		check('recipes_cook_count_check', sql`${table.cookCount} >= 0`),
		check('recipes_last_cooked_at_check', sql`${table.lastCookedAt} is null or ${table.lastCookedAt} >= 0`),
		check('recipes_status_check', sql`${table.status} in ('active', 'archived')`),
		check('recipes_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		check('recipes_created_at_check', sql`${table.createdAt} >= 0`),
		check('recipes_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('recipes_user_status_last_cooked_at_index').on(table.userId, table.status, table.lastCookedAt),
		index('recipes_source_created_at_index').on(table.source, table.createdAt),
		index('recipes_status_cook_count_index').on(table.status, table.cookCount),
		index('recipes_last_cooked_index').on(table.lastCookedAt).where(sql`status = 'active'`),
		index('recipes_source_session_id_index').on(table.sourceSessionId).where(sql`source_session_id IS NOT NULL`),
	],
)

export type BrainRecipe = typeof recipes.$inferSelect
export type NewBrainRecipe = typeof recipes.$inferInsert
