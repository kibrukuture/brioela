# Recipe Ingestion — Overview

## What This Folder Covers
The share-sheet pipeline: a user shares a food video or URL from TikTok, YouTube, Instagram, or any browser to Brioela. The backend fetches the source, extracts transcript, captions, visible text, and page content. A model normalizes the result into a structured recipe — ingredients, steps, timing, servings — with confidence markers on uncertain fields. The recipe lands in the user's library and personal memory without any copy/paste. The share-sheet extension (iOS and Android) is one of the highest-leverage distribution mechanisms in the app: someone watching a food video → shares to Brioela → has a reason to install.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — full spec: share-sheet ingestion, URL ingestion, video transcript extraction, recipe normalization, confidence schema, data model, API surface
- `brioela-specs/20-platform-and-app-distribution.md` — share-sheet extension mechanics: must launch import job immediately, confirm to user within 2 seconds, works from background without app open
- `brioela-specs/25-viral-growth-and-sharing.md` — "user is watching a recipe video on TikTok → taps Share → Brioela → recipe is imported" is explicitly named as an acquisition mechanism

## Key Decisions From Specs
- Share-sheet extension must be built and listed in the App Store from day one — it is a distribution mechanism, not just a utility
- Extension launches the import job immediately (background process) and confirms to user within 2 seconds
- User does NOT need to have Brioela open — extension works from background
- Import job is async: `recipe_import_job` row written immediately, processing continues in background via Upstash Workflow
- Source attribution preserved on every import (for trust and later reprocessing if model improves)
- Quantity estimation supports nullable/confidence-based schema — uncertain values marked `estimated`, never fabricated
- Imported recipes are re-rankable by user allergies, dislikes, budget, and nearby product availability
- If media parsing fails: store source with `partial` status — never silently drop the import

## Data Model
```
recipe_import_job:   user_id, source_type, source_url, status, started_at, completed_at
recipe_source_artifact:  import_job_id, transcript, captions, extracted_text, thumbnail_url
user_recipe:         user_id, recipe_id, title, ingredients_json, steps_json, cuisine, difficulty, confidence
```

## API Surface
- `POST /api/recipes/import` — receives shared URL or media reference from the extension
- `GET /api/recipes/import/:jobId` — poll status (or push via notification when complete)
- `GET /api/recipes/:id` — retrieve a completed recipe

## What This Folder Depends On
- `05-orchestrator` — completed recipes written to user's recipe library in Orchestrator DO SQLite
- `03-foundation` — Upstash Workflow runs the multi-step import job (fetch → extract → normalize → store); share-sheet extension is a native iOS/Android target registered in the Cloudflare Worker

## What Depends On This Folder
- `07-cooking-session` — imported recipes are a primary source for cooking sessions; a recipe imported from TikTok is cookable immediately
- `11-pantry-meal-plan` — imported recipes enter the recipe pool for meal plan generation
- `21-viral-sharing` — share-sheet import is the named acquisition mechanism in the viral growth spec; the "TikTok → Brioela" loop depends on this folder being built
