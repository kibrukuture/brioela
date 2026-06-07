# 02. Recipe Ingestion From Shared Content

## Goal
Convert food content shared from TikTok, YouTube, Instagram, or web recipe URLs into structured, reusable recipes inside Brioela without manual copy/paste.

## User Outcome
- Share a video or URL to Brioela.
- Brioela extracts ingredients, steps, timing, and likely servings.
- Recipe becomes searchable and tied to the user's food memory.

## In Scope
- Mobile share-sheet ingestion.
- URL ingestion.
- Video transcript extraction when available.
- GPT-4o mini vision extraction of on-screen ingredient text.
- Recipe normalization into a canonical schema.

## Out of Scope
- Live cooking guidance.
- Community publishing of imported recipes.

## Processing Flow
1. Client receives shared URL or media reference.
2. Backend fetches source metadata.
3. Extract transcript, captions, visible text, and page content.
4. Model normalizes recipe into structure.
5. Confidence checks flag uncertain quantities and missing steps.
6. Store recipe under the user's library and personal memory.

## Data Model
- `recipe_import_job`: user_id, source_type, source_url, status, started_at, completed_at.
- `recipe_source_artifact`: import_job_id, transcript, captions, extracted_text, thumbnail_url.
- `user_recipe`: user_id, recipe_id, title, ingredients_json, steps_json, cuisine, difficulty, confidence.

## API Surface
- `POST /api/recipes/import`
- `GET /api/recipes/import/:jobId`
- `GET /api/recipes/:id`

## Technical Notes
- Imported recipes should preserve source attribution for trust and later reprocessing.
- Quantity estimation must support unknown values using a nullable or confidence-based schema.
- Imported recipes must be re-rankable by user allergies, dislikes, budget, and nearby availability.

## Failure Handling
- If media parsing fails, store source with `partial` status instead of dropping it.
- If quantities are ambiguous, mark steps or ingredients as `estimated`.

## Success Metrics
- Import completion rate.
- Time from share to usable recipe.
- Number of imported recipes later cooked or referenced.
