# Recipe Ingestion — Confidence And Constraints

## What This File Covers

How imported recipes expose uncertainty, how they are checked against the user's constraints, and how they remain re-rankable by allergies, dislikes, budget, and nearby availability.

---

## Confidence UI States

Imported recipes need visible uncertainty.

| Confidence | Status | UI treatment |
|---|---|---|
| >= 0.85 | ready | cookable, normal display |
| 0.65-0.84 | review helpful | show warnings before cooking |
| 0.40-0.64 | needs review | user should review/edit before cooking |
| < 0.40 | partial | save source only, do not present as full recipe |

Warnings should be specific:

- "Quantities estimated from video transcript."
- "Steps may be incomplete."
- "Cooking time not found."
- "Ingredient list came from screenshot OCR."

---

## Constraint Check

After normalization, run the imported recipe against the user's constraint profile.

Inputs:

- confirmed hard allergies
- intolerances
- dietary identity
- dislikes
- boycott preferences
- medical-condition watchlists when available

Result shape:

```typescript
type ImportedRecipeConstraintResult = {
  recipeId: string | null
  status: "clear" | "caution" | "blocked"
  findings: Array<{
    ingredientName: string
    constraintType: "hard_allergy" | "intolerance" | "dietary_identity" | "dislike" | "boycott" | "medical_watchlist"
    severity: "hard" | "soft"
    message: string
  }>
  suggestedSubstitutions: Array<{
    original: string
    substitute: string
    reason: string
    confidence: number
  }>
}
```

Hard conflicts should be visible before the user cooks.

---

## Constraint Copy

Use practical copy:

- "Contains peanut, which conflicts with your allergy."
- "Uses butter; not vegan as written."
- "You usually avoid cilantro."
- "May need review for gluten because soy sauce type is unclear."

Avoid medical certainty:

- "This recipe is medically safe."
- "This will not affect your condition."

---

## Re-Rankable Recipe Metadata

Imported recipes must be useful beyond the import screen.

Store enough metadata for later ranking:

```typescript
type ImportedRecipeRankingMetadata = {
  ingredientNames: string[]
  constraintTags: string[]
  estimatedCostBand: "low" | "medium" | "high" | "unknown"
  pantryMatchScore: number | null
  nearbyAvailabilityScore: number | null
  cuisine: string | null
  difficulty: "easy" | "medium" | "hard" | "unknown"
  totalTimeMinutes: number | null
}
```

This supports:

- meal planning
- pantry rescue
- cooking session selection
- budget ranking
- nearby product availability

---

## Substitution Boundary

Substitutions can be suggested, but they should not silently rewrite the recipe.

Rules:

- Keep the original imported recipe intact.
- Show substitutions as user-specific overlays.
- If user accepts substitutions, save a personalized variant or note.
- Do not overwrite source recipe with allergy-safe edits automatically.

The source recipe and the user's adapted version are different things.

---

## Partial Recipes

Partial recipes can still be valuable.

Partial states:

- `source_saved`: source only
- `ingredients_only`: no reliable method
- `steps_only`: missing quantities
- `needs_user_review`: enough structure, but uncertainty too high

Partial recipes should not enter meal plans or cooking sessions until reviewed or upgraded.
