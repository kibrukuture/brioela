# Recipe Ingestion — Import Job Workflow

## What This File Covers

The durable async job model for shared-content intake and recipe imports: job rows, classification, Upstash Workflow steps, retries, partial completion, status polling, and why the share extension does not wait for processing.

---

## Job Lifecycle

Shared-content intake is asynchronous. Recipe import is one downstream route.

The initial endpoint only creates a job:

```typescript
type RecipeImportJob = {
  jobId: string
  userId: string
  sourceType: "url" | "video_url" | "image" | "native_media_reference"
  sourceUrl: string | null
  sourceApp: string | null
  route: "unknown" | "recipe" | "menu" | "place" | "product" | "receipt" | "memory_note"
  status: "queued" | "classifying" | "extracting" | "normalizing" | "routing" | "needs_review" | "completed" | "partial" | "failed"
  startedAt: number
  completedAt: number | null
  failureReason: string | null
}
```

Status rules:

- `queued`: job row exists, workflow not yet started.
- `classifying`: server is deciding what kind of shared content this is.
- `extracting`: source fetch/transcript/OCR/page extraction running.
- `normalizing`: model is building the canonical recipe.
- `routing`: non-recipe content is being routed to the correct Brioela feature/memory.
- `needs_review`: recipe is usable but has meaningful uncertainty.
- `completed`: recipe saved to library.
- `partial`: source stored, but recipe could not be fully extracted.
- `failed`: unrecoverable failure with reason.

---

## Workflow Steps

Use Upstash Workflow for the multi-step import job.

```typescript
type RecipeImportWorkflowState = {
  jobId: string
  userId: string
  input: RecipeShareInput
  classification: SharedContentClassification | null
  artifacts: RecipeSourceArtifacts | null
  normalizedRecipe: NormalizedImportedRecipe | null
}
```

Workflow steps:

1. Fetch source metadata.
2. Classify shared content.
3. Route obvious non-recipes to the correct feature path.
4. Extract source artifacts for recipe-like content.
5. If evidence is incomplete, run deeper public web search for supporting recipe evidence.
6. Normalize recipe only if enough evidence exists.
7. Run confidence checks.
8. Run user constraint compatibility check.
9. Store recipe, partial artifact, or non-recipe routed memory.
10. Mark job complete and optionally notify/in-app surface.

The workflow should be idempotent by `jobId`. Retrying a step must not create duplicate recipes.

---

## API Surface

```typescript
// Starts import.
POST /api/shared/import

// Starts recipe-specific import when caller already knows route.
POST /api/recipes/import

// Polls status.
GET /api/recipes/import/:jobId

// Reads completed recipe.
GET /api/recipes/:id
```

Status response:

```typescript
type RecipeImportStatusResponse = {
  jobId: string
  status: RecipeImportJob["status"]
  route: RecipeImportJob["route"]
  recipeId: string | null
  previewTitle: string | null
  thumbnailUrl: string | null
  warnings: string[]
  failureReason: string | null
}
```

---

## Retry Rules

Retry transient failures:

- network timeout
- source fetch 5xx
- transcript provider timeout
- model timeout
- temporary OCR failure

Do not retry:

- unsupported URL scheme
- auth-gated/private content inaccessible to backend
- source deleted
- non-food content detected with high confidence and no useful memory route
- malicious or unsafe URL

After retries fail, store a `partial` job if any useful artifact exists. Do not silently drop imports.

---

## Partial Status

`partial` is a valid product state.

Examples:

- source URL saved, but video transcript unavailable
- title and thumbnail available, but no recipe steps found
- screenshot OCR extracted ingredients but not method
- model produced a low-confidence recipe needing review
- shared place/menu/product content routed successfully, but recipe reconstruction not applicable

Partial copy:

```text
I saved the source, but could not fully turn it into a recipe yet.
```

The user can retry later. Preserving the source allows future model upgrades to reprocess old imports.

---

## Idempotency

Duplicate shares are common.

Deduplication keys:

- same user
- normalized source URL or URL hash
- same source app
- share timestamp window
- source content fingerprint if available

If duplicate import is detected, return the existing active/completed job instead of creating another one.

---

## Completion Surface

If the user is in the app, show in-app completion. Push notification is allowed only if notification rules permit and the user is not active.

Completion copy:

```text
Recipe imported: Spicy Chickpea Bowl.
```

One action only:

```text
Open recipe
```
