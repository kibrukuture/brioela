# Draft: match.pantry.recipes.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/match.pantry.recipes.helper.ts`

**Gap (feature 34):** Rank recipes by ingredient coverage against snapshot detections + constraints.

**Source:** `build-guide/14-pantry-meal-plan/02-recipe-matching.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'
import { deriveIngredientNames } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

export type PantryRecipeMatchResult = {
  recipeId: string
  recipeTitle: string
  coverageScore: number
  substitutionScore: number
  rank: number
}

type MatchPantryRecipesInput = {
  db: BrainSqlite
  userId: string
  snapshotId: string
  detectedLabels: string[]
  limit?: number
}

export async function matchPantryRecipes(
  input: MatchPantryRecipesInput,
): Promise<PantryRecipeMatchResult[]> {
  const pool = await loadConstraintSafeRecipePool(input.db, input.userId)
  const detected = new Set(input.detectedLabels.map((l) => l.toLowerCase()))

  const scored = pool
    .map((recipe) => {
      const ingredients = deriveIngredientNames(recipe.content)
      const covered = ingredients.filter((name) =>
        detected.has(name.toLowerCase()),
      ).length
      const coverageScore =
        ingredients.length === 0 ? 0 : covered / ingredients.length
      const substitutionScore = 1 - coverageScore
      return {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        coverageScore,
        substitutionScore,
      }
    })
    .filter((r) => r.coverageScore > 0)
    .sort((a, b) => b.coverageScore - a.coverageScore)

  const limit = input.limit ?? 10
  const ranked = scored.slice(0, limit).map((row, index) => ({
    ...row,
    rank: index + 1,
  }))

  await cachePantryRecipeMatches(input.db, input.snapshotId, ranked)
  return ranked
}

async function loadConstraintSafeRecipePool(db: BrainSqlite, userId: string) {
  void db
  void userId
  return [] as Array<{ id: string; title: string; content: unknown }>
}

async function cachePantryRecipeMatches(
  db: BrainSqlite,
  snapshotId: string,
  matches: PantryRecipeMatchResult[],
): Promise<void> {
  void db
  void snapshotId
  void matches
}
```

Pool priority (spec 14): saved → cooked → shared-compatible → generated.
