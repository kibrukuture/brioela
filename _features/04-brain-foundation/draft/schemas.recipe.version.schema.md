# Draft: recipe.version.schema.ts

Target: `backend/src/agents/brain/_schemas/recipe.version.schema.ts`

```ts
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const recipeVersions = sqliteTable(
	'recipe_versions',
	{
		id: text('id').primaryKey(),
		recipeId: text('recipe_id').notNull(),
		userId: text('user_id').notNull(),
		version: integer('version', { mode: 'number' }).notNull(),
		content: text('content').notNull(),
		updatedBy: text('updated_by').notNull(),
		updateReason: text('update_reason').notNull(),
		archivedAt: integer('archived_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('recipe_versions_version_check', sql`${table.version} >= 1`),
		check('recipe_versions_updated_by_check', sql`${table.updatedBy} in ('agent', 'brain_maintenance')`),
		check('recipe_versions_archived_at_check', sql`${table.archivedAt} >= 0`),
		index('recipe_versions_recipe_id_version_index').on(table.recipeId, table.version),
	],
)

export type BrainRecipeVersion = typeof recipeVersions.$inferSelect
export type NewBrainRecipeVersion = typeof recipeVersions.$inferInsert
```
