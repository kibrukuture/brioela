# Recipe Ingestion — Source Extraction

## What This File Covers

How Brioela extracts source artifacts from shared URLs, videos, web pages, screenshots, captions, transcripts, visible text, and thumbnails before recipe normalization.

---

## Extraction Goal

Extraction collects evidence. It does not create the recipe and it does not assume the share is a recipe.

Artifacts are stored so the normalizer can reason from them and future model upgrades can reprocess them.

```typescript
type RecipeSourceArtifacts = {
  jobId: string
  sourceUrl: string | null
  canonicalUrl: string | null
  title: string | null
  authorName: string | null
  transcript: string | null
  captions: string | null
  extractedPageText: string | null
  extractedImageText: string | null
  thumbnailUrl: string | null
  mediaDurationSeconds: number | null
  extractionWarnings: string[]
}
```

---

## URL And Page Extraction

For web pages:

- Fetch only HTTP(S) URLs.
- Follow redirects within limits.
- Enforce timeout and response-size limits.
- Extract visible text, structured recipe markup when present, title, author/source, and thumbnail.
- Ignore ads, comments, unrelated navigation, tracking copy, and hidden text.
- Preserve canonical URL when available.

If schema.org recipe markup exists, use it as strong evidence, not unquestioned truth. The normalizer still validates field consistency.

---

## Video Extraction

For TikTok, YouTube, Instagram, and similar sources:

- Prefer official or platform-provided transcript/captions when available.
- Extract captions/subtitles if accessible.
- Extract page title, description, hashtags only as weak context.
- Pull thumbnail for user recognition.
- If transcript is unavailable, rely on visible text from GPT-4o mini vision extraction and metadata where possible.

Do not download full videos unless explicitly supported by platform terms and backend design. The first implementation can import from metadata/transcripts/captions/visible text and mark unsupported media as `partial`.

---

## Screenshot And Image Vision Extraction

Screenshots and recipe images use the server-side GPT-4o mini vision extraction pattern from `07-scanner/05-gpt4o-mini-vision-fallback.md`.

Image rules:

- Run contrast enhancement before vision extraction.
- Extract visible ingredient lists, step text, title, and timing.
- Preserve vision extraction confidence and warnings.
- Never invent text missing from the image.
- If multiple images are shared, preserve order.

Vision extraction warnings:

- `low_light`
- `partial_crop`
- `text_too_small`
- `vision_extraction_uncertain`
- `non_recipe_image`

---

## Source Classification

Before normalization, classify source quality:

```typescript
type RecipeSourceClassification = {
  isLikelyRecipe: boolean
  contentKind: "recipe_page" | "food_video" | "caption_recipe" | "screenshot_recipe" | "menu" | "place" | "product" | "receipt" | "food_note" | "non_food" | "uncertain"
  extractionConfidence: number
  reasons: string[]
}
```

If `isLikelyRecipe` is false with high confidence, route the content through `08-shared-content-router.md`. Do not mark useful food content failed just because it is not a recipe.

---

## Deep Web Search For Recipe Reconstruction

If shared content appears recipe-like but lacks enough detail, Brioela can run a deeper public web search before giving up.

Use this only when the initial artifacts suggest a specific recipe or dish:

- title or dish name is visible
- creator caption mentions a dish
- transcript has partial ingredients
- page metadata suggests recipe content
- screenshot shows a recognizable dish/ingredient list

Search evidence can include:

- same canonical URL indexed elsewhere
- creator's linked recipe page
- matching dish title on public recipe sites
- public transcript/caption mirrors
- source description or pinned comment text when accessible

Rules:

- Never invent a recipe from generic web results.
- Prefer same-source or creator-owned pages over unrelated recipes.
- Require enough corroboration before constructing a recipe.
- Preserve all sources used as attribution/evidence.
- If evidence stays weak, save as partial instead of fabricating.

---

## Artifact Storage Boundary

Artifacts are source evidence, not the user's final recipe.

Storage rules:

- Preserve source attribution.
- Preserve enough artifact text to reprocess later.
- Do not store cookies, private auth tokens, or user session headers.
- Do not scrape private content behind authentication unless the platform provides a safe user-granted media reference.
- Strip unnecessary personal data from shared captions/comments.

The user's private recipe lives in Brain SQLite. Source artifacts can live in backend storage tied to the import job, with access scoped to the user.
