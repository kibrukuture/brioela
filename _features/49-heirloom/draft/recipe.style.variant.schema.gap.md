# Draft: recipe.style.variant.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/recipe.style.variant.schema.ts`

**Gap (feature 49):** "Cook in [name]'s style" output — spec **32**.

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const recipeStyleVariants = sqliteTable(
	'recipe_style_variant',
	{
		id: text('id').primaryKey(),
		recipeId: text('recipe_id').notNull(),
		profileId: text('profile_id').notNull(),
		adaptedRecipeJson: text('adapted_recipe_json').notNull(),
		adaptationNotes: text('adaptation_notes').notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		index('recipe_style_variant_recipe_index').on(table.recipeId),
		index('recipe_style_variant_profile_index').on(table.profileId),
	],
)

export type RecipeStyleVariantRow = typeof recipeStyleVariants.$inferSelect
export type NewRecipeStyleVariantRow = typeof recipeStyleVariants.$inferInsert
```
