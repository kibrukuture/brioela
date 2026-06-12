# Gap snapshot: match.find.to.cooking.gap.helper.ts

Target: `backend/src/api/finds/_helpers/match.find.to.cooking.gap.helper.ts`

**Status:** Not in repo. **Second release.** From `build-guide/09-ground/06-find-to-cooking-trigger.md`, 35b Angle 4.

```typescript
type FindCookingMatchInput = {
  findId: string
  findContent: string
  locationId: string
  locationName: string
  signalType: 'health' | 'ingredient' | 'price' | 'new_product' | 'general'
  userId: string
  distanceMeters: number
}

type FindCookingMatchResult =
  | { matched: false }
  | {
      matched: true
      ingredient: string
      recipeId: string | null
      recipeTitle: string | null
      ambientCard: {
        headline: string
        actions: ['set_reminder', 'start_cooking_session']
        findId: string
        locationId: string
      }
    }

export async function matchFindToCookingGap(
  input: FindCookingMatchInput,
  env: Env,
): Promise<FindCookingMatchResult> {
  const brain = await env.BRAIN.get(env.BRAIN.idFromName(input.userId))

  const gaps = await brain.fetch('https://brain/internal/memory-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'ingredient_not_found',
      limit: 20,
    }),
  })

  if (!gaps.ok) return { matched: false }

  const gapEvents: Array<{ entityId: string; capturedAt: number }> = await gaps.json()
  const findKeywords = extractIngredientKeywords(input.findContent)

  for (const gap of gapEvents) {
    const ingredient = gap.entityId
    if (!findKeywords.some((k) => ingredientIncludes(ingredient, k))) continue

    const recipe = await findRecipeForIngredient(input.userId, ingredient, env)
    if (!recipe) continue

    return {
      matched: true,
      ingredient,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      ambientCard: {
        headline: `Fresh ${ingredient} spotted ${Math.round(input.distanceMeters)}m away at ${input.locationName}. Cook tonight?`,
        actions: ['set_reminder', 'start_cooking_session'],
        findId: input.findId,
        locationId: input.locationId,
      },
    }
  }

  return { matched: false }
}

function extractIngredientKeywords(content: string): string[] {
  return content.toLowerCase().split(/[\s,.-]+/).filter((w) => w.length > 3)
}

function ingredientIncludes(ingredient: string, keyword: string): boolean {
  return ingredient.toLowerCase().includes(keyword) || keyword.includes(ingredient.toLowerCase())
}

async function findRecipeForIngredient(
  userId: string,
  ingredient: string,
  env: Env,
): Promise<{ id: string; title: string } | null> {
  return null
}
```

**Dependencies:** `ingredient_not_found` memory event kind (**05** — not in enum yet). Ambient card rendered by **35**. Find itself does not write memory.
