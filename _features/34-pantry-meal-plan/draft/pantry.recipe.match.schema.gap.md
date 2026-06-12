# Draft: pantry.recipe.match.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/pantry.recipe.match.schema.ts`

**Gap (feature 34):** Cached rescue rankings for a snapshot.

**Source:** `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`, `build-guide/14-pantry-meal-plan/02-recipe-matching.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pantryRecipeMatches = sqliteTable('pantry_recipe_match', {
  id: text('id').primaryKey(),
  snapshotId: text('snapshot_id').notNull(),
  recipeId: text('recipe_id').notNull(),
  coverageScore: real('coverage_score').notNull(),
  substitutionScore: real('substitution_score').notNull(),
  rank: integer('rank').notNull(),
  createdAt: integer('created_at').notNull(),
})

export type PantryRecipeMatchRow = typeof pantryRecipeMatches.$inferSelect
export type InsertPantryRecipeMatchRow = typeof pantryRecipeMatches.$inferInsert
```

Indexes: `(snapshot_id, rank)`, `(snapshot_id, recipe_id)` unique.
