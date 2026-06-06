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

If a hard conflict is found, the import still saves, but the default action changes from `cook` to `review` or `adapt`. The user should not be dropped into a cooking session for a recipe that conflicts with their profile.

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

## Conversational Review Surface

When an imported recipe has allergy/diet conflicts or major uncertainty, Brioela can offer a live review conversation.

This uses the same voice/video assistant stack documented in `08-cooking-session`: Cloudflare Realtime plus Gemini Live, with Orchestrator context and tool forwarding. The surface is not limited to cooking. It can be used anywhere Brioela needs real-time intelligence and conversation: recipe review, shopper help, restaurant/menu questions, or scan follow-up.

Recipe review examples:

- "This recipe contains cashews, which conflicts with your allergy. Want to talk through substitutions?"
- "The video did not give exact quantities. Want me to walk through the recipe and fill gaps with you?"
- "This looks vegan except for honey. Want an alternative?"

Rules:

- Hard allergy conflict appears in UI before any conversational option.
- The agent can explain and adapt; it must not hide or downgrade the conflict.
- Accepted substitutions become a user-specific variant or note, not an overwrite of the source recipe.
- If video/camera context is not needed, use voice/text only; do not force live video.

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
