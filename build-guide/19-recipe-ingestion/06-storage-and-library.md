# Recipe Ingestion — Storage And Library

## What This File Covers

How completed imports become user recipes, how source artifacts are retained, how memory events are logged, and how imported recipes connect to cooking sessions and meal planning.

---

## Storage Boundary

There are two related records:

- Import job/source artifacts: evidence and processing state.
- User recipe: the normalized private recipe in the user's library.

For non-recipe shares, this folder does not create a recipe row. It routes to the relevant feature/memory path described in `08-shared-content-classifier.md`.

The final user recipe belongs in the Brain DO SQLite `recipes` table. Source artifacts can be stored with the import job and scoped to the user.

---

## User Recipe Write

The existing Brain Memory recipe schema is the target:

```typescript
type RecipeRow = {
  id: string
  userId: string
  title: string
  source: "url" | "manual" | "cooking_session" | "family_capture"
  sourceSession: string | null
  sourceUrl: string | null
  content: string
  cookCount: number
  lastCookedAt: number | null
  status: "active" | "archived"
  confidence: number
  createdAt: number
  updatedAt: number
}
```

For imported recipes:

- `source = "url"` for URL/video/share imports in the current schema.
- `sourceUrl` stores the canonical source URL when available.
- `content` stores the normalized recipe JSON plus attribution, warnings, and ranking metadata.
- `confidence` stores overall import confidence.

If implementation needs finer source types later (`video`, `image`, `shared_url`), update the Brain Memory schema intentionally instead of overloading silently.

---

## Source Artifact Record

```typescript
type RecipeSourceArtifact = {
  artifactId: string
  importJobId: string
  userId: string
  transcript: string | null
  captions: string | null
  extractedText: string | null
  extractedImageText: string | null
  thumbnailUrl: string | null
  createdAt: number
}
```

Artifact retention lets Brioela reprocess old imports when models improve.

Do not store authentication headers, cookies, platform session tokens, or private source credentials.

---

## Memory Event

Write a lightweight `memory_event` after successful import:

```typescript
type RecipeImportedEvent = {
  kind: "recipe_imported"
  recipeId: string
  sourceType: "url" | "video_url" | "image" | "native_media_reference"
  sourceApp: string | null
  title: string
  confidence: number
  status: "completed" | "needs_review" | "partial"
}
```

This lets Ambient Intelligence and Food Time Machine know the recipe entered the user's food history.

---

## Library Behavior

Completed imports appear in the recipe library immediately.

Library card should show:

- title
- thumbnail if available
- source app/domain
- confidence or review warning if needed
- constraint status for this user
- primary action: cook, review, or edit

Partial imports appear in a separate review/pending area, not mixed with fully cookable recipes.

Non-recipe shares should appear in the destination surface, not in the recipe library. A restaurant share goes to map/place context, a menu share goes to menu scanning, a receipt share goes to receipt intelligence, and a general food note goes to user memory if useful.

---

## Cooking Session Handoff

Imported recipes must be compatible with Cooking Session.

Handoff payload:

```typescript
type CookImportedRecipeRequest = {
  recipeId: string
  userId: string
  applyAcceptedSubstitutions: boolean
}
```

Cooking session reads the recipe through Brain tools. It should see:

- ingredients
- steps
- timing
- uncertainty warnings
- source attribution
- user-specific constraint findings

Mira can ask clarifying questions when quantities or steps are uncertain.

---

## Meal Plan Handoff

Only recipes with enough confidence should enter meal planning.

Meal-plan eligible:

- confidence >= 0.65
- at least 2 ingredients
- at least 2 steps
- no unresolved hard constraint conflict

Needs review before meal plan:

- missing quantities for major ingredients
- no timing
- hard conflict with no accepted substitution
- low extraction confidence
