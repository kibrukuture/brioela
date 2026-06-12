# Draft: recipe.schema

Target: `backend/src/agents/brain/_schemas/recipe.schema.ts`

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'
import { recipeOriginValues } from '@/agents/brain/_schemas/recipe.origin.schema'

const recipeStatus = ['active', 'archived'] as const

export const recipes = sqliteTable(
	'recipes',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		title: text('title').notNull(),
		origin: text('origin', { enum: recipeOriginValues }).notNull(),
		sessionId: text('session_id'),
		linkUrl: text('link_url'),
		content: text('content').notNull(),
		version: integer('version', { mode: 'number' }).notNull().default(1),
		cookCount: integer('cook_count', { mode: 'number' }).notNull().default(0),
		lastCookedAt: integer('last_cooked_at', { mode: 'number' }),
		status: text('status', { enum: recipeStatus }).notNull().default('active'),
		confidence: real('confidence').notNull().default(1.0),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('recipes_content_json_object_check', sql`json_valid(${table.content}) and json_type(${table.content}) = 'object'`),
		check('recipes_title_matches_content_check', sql`json_extract(${table.content}, '$.title') = ${table.title}`),
		check('recipes_version_check', sql`${table.version} >= 1`),
		check('recipes_cook_count_check', sql`${table.cookCount} >= 0`),
		check('recipes_last_cooked_at_check', sql`${table.lastCookedAt} is null or ${table.lastCookedAt} >= 0`),
		check('recipes_status_check', sql`${table.status} in ('active', 'archived')`),
		check('recipes_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		check('recipes_created_at_check', sql`${table.createdAt} >= 0`),
		check('recipes_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('recipes_user_status_last_cooked_at_index').on(table.userId, table.status, table.lastCookedAt),
		index('recipes_origin_created_at_index').on(table.origin, table.createdAt),
		index('recipes_status_cook_count_index').on(table.status, table.cookCount),
		index('recipes_last_cooked_index').on(table.lastCookedAt).where(sql`status = 'active'`),
		index('recipes_session_id_index').on(table.sessionId).where(sql`session_id IS NOT NULL`),
	],
)

export type BrainRecipe = typeof recipes.$inferSelect
export type NewBrainRecipe = typeof recipes.$inferInsert
```
