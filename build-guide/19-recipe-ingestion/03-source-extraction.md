# Recipe Ingestion — Source Extraction

## What This File Covers

How Brioela extracts source artifacts from shared URLs, videos, web pages, screenshots, captions, transcripts, visible text, and thumbnails before recipe normalization.

---

## Extraction Goal

Extraction collects evidence. It does not create the recipe.

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
  ocrText: string | null
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
- If transcript is unavailable, rely on visible text/OCR and metadata where possible.

Do not download full videos unless explicitly supported by platform terms and backend design. The first implementation can import from metadata/transcripts/captions/visible text and mark unsupported media as `partial`.

---

## Screenshot And Image OCR

Screenshots and recipe images use the server-side OCR pattern from `07-scanner/05-ocr-fallback.md`.

Image rules:

- Run contrast enhancement before OCR.
- Extract visible ingredient lists, step text, title, and timing.
- Preserve OCR confidence and warnings.
- Never invent text missing from the image.
- If multiple images are shared, preserve order.

OCR warnings:

- `low_light`
- `partial_crop`
- `text_too_small`
- `ocr_uncertain`
- `non_recipe_image`

---

## Source Classification

Before normalization, classify source quality:

```typescript
type RecipeSourceClassification = {
  isLikelyRecipe: boolean
  contentKind: "recipe_page" | "food_video" | "caption_recipe" | "screenshot_recipe" | "non_recipe" | "uncertain"
  extractionConfidence: number
  reasons: string[]
}
```

If `isLikelyRecipe` is false with high confidence, mark the job `failed` or `partial` depending on whether saving the source is useful.

---

## Artifact Storage Boundary

Artifacts are source evidence, not the user's final recipe.

Storage rules:

- Preserve source attribution.
- Preserve enough artifact text to reprocess later.
- Do not store cookies, private auth tokens, or user session headers.
- Do not scrape private content behind authentication unless the platform provides a safe user-granted media reference.
- Strip unnecessary personal data from shared captions/comments.

The user's private recipe lives in Orchestrator SQLite. Source artifacts can live in backend storage tied to the import job, with access scoped to the user.
