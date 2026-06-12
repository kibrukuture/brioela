# Gap snapshot: score.find.relevance.helper.ts

Target: `backend/src/api/finds/_helpers/score.find.relevance.helper.ts`

**Status:** Not in repo. From `brioela-specs/35b-ground-finds-deep-design.md` Angle 1.

```typescript
type UserIngredientProfile = {
  topIngredients: string[]
  constraintFlags: string[]
  cookingCuisines: string[]
}

type ScoreRelevanceInput = {
  signalType: 'health' | 'ingredient' | 'price' | 'new_product' | 'general'
  locationId: string
  activeCount: number
  lastFindAt: string | null
  userProfile: UserIngredientProfile
  findContentKeywords?: string[]
}

export async function scoreFindRelevance(input: ScoreRelevanceInput): Promise<number> {
  const { userProfile, findContentKeywords = [] } = input

  if (userProfile.topIngredients.length === 0 && userProfile.constraintFlags.length === 0) {
    return 0.3
  }

  const profileTerms = [
    ...userProfile.topIngredients,
    ...userProfile.constraintFlags,
    ...userProfile.cookingCuisines,
  ].map((t) => t.toLowerCase())

  const findTerms = findContentKeywords.map((t) => t.toLowerCase())
  if (findTerms.length === 0) {
    return signalTypeBaseline(input.signalType)
  }

  let overlap = 0
  for (const term of findTerms) {
    if (profileTerms.some((p) => p.includes(term) || term.includes(p))) {
      overlap += 1
    }
  }

  const overlapRatio = Math.min(1, overlap / Math.max(1, findTerms.length))
  const freshnessBoost = freshnessMultiplier(input.lastFindAt)

  return Math.min(1, overlapRatio * 0.85 + freshnessBoost * 0.15)
}

function signalTypeBaseline(signalType: ScoreRelevanceInput['signalType']): number {
  switch (signalType) {
    case 'health':
      return 0.5
    case 'ingredient':
      return 0.35
    case 'price':
      return 0.25
    case 'new_product':
      return 0.2
    default:
      return 0.15
  }
}

function freshnessMultiplier(lastFindAt: string | null): number {
  if (!lastFindAt) return 0
  const ageHours = (Date.now() - new Date(lastFindAt).getTime()) / 3_600_000
  if (ageHours < 2) return 1
  if (ageHours < 12) return 0.8
  if (ageHours < 48) return 0.5
  return 0.2
}
```

**Render formula:** `rendered_dot_size = base_size × (1 + relevance_score × 0.8)` (35b).
