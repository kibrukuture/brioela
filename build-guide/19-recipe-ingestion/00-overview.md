# Recipe Ingestion — Overview

## What This Folder Covers
The share-sheet pipeline: a user shares food-related content from TikTok, YouTube, Instagram, maps, browsers, screenshots, or another app to Brioela. The first step is classification, not recipe extraction. If the content is recipe-like, the backend extracts transcript, captions, visible text, page content, and supporting web evidence, then normalizes a structured recipe with confidence markers. If it is not a recipe, the agent routes it to the relevant Brioela surface: place/map memory, menu scanning, product scan context, receipt intelligence, or general user memory. The share-sheet extension (iOS and Android) is one of the highest-leverage distribution mechanisms in the app: someone watching food content → shares to Brioela → Brioela knows what to do with it.

## Status
[x] complete — eight files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-share-sheet-entry.md` | iOS/Android share extension, 2-second confirmation, background import start |
| `02-import-job-workflow.md` | `recipe_import_job`, durable async processing, status polling, retry behavior |
| `03-source-extraction.md` | URL/video/page/screenshot extraction, transcript/caption/OCR/page text artifacts |
| `04-recipe-normalization.md` | canonical recipe schema, ingredient/step/timing/serving extraction, no fabrication |
| `05-confidence-and-constraints.md` | uncertain quantities, missing steps, user constraint checks, re-rankable recipes |
| `06-storage-and-library.md` | recipe persistence in Orchestrator SQLite, source artifacts, memory events |
| `07-import-status-and-growth-loop.md` | user-facing import states, failure handling, share-sheet acquisition loop |
| `08-shared-content-router.md` | classify any shared food content and route non-recipes to the right Brioela feature/memory |

## Specs This Folder Draws From
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — full spec: share-sheet ingestion, URL ingestion, video transcript extraction, recipe normalization, confidence schema, data model, API surface
- `brioela-specs/20-platform-and-app-distribution.md` — share-sheet extension mechanics: must launch import job immediately, confirm to user within 2 seconds, works from background without app open
- `brioela-specs/25-viral-growth-and-sharing.md` — "user is watching a recipe video on TikTok → taps Share → Brioela → recipe is imported" is explicitly named as an acquisition mechanism

## Key Decisions From Specs
- Share-sheet extension must be built and listed in the App Store from day one — it is a distribution mechanism, not just a utility
- Extension launches the import job immediately (background process) and confirms to user within 2 seconds
- User does NOT need to have Brioela open — extension works from background
- Shared content is classified before recipe extraction; not every share is treated as a recipe
- Import job is async: `recipe_import_job` row written immediately, processing continues in background via Upstash Workflow
- If recipe evidence is incomplete, Brioela may run deeper web search for supporting public recipe evidence before deciding whether reconstruction is safe enough
- Source attribution preserved on every import (for trust and later reprocessing if model improves)
- Quantity estimation supports nullable/confidence-based schema — uncertain values marked `estimated`, never fabricated
- Imported recipes are re-rankable by user allergies, dislikes, budget, and nearby product availability
- Hard allergy/diet conflicts surface in UI before cooking and can escalate into a voice/video agent review
- If media parsing fails: store source with `partial` status — never silently drop the import

## Data Model
```
shared_import_job:   user_id, source_type, source_url, route, status, started_at, completed_at
recipe_import_job:   user_id, shared_import_job_id, source_type, source_url, status, started_at, completed_at
recipe_source_artifact:  import_job_id, transcript, captions, extracted_text, thumbnail_url
user_recipe:         user_id, recipe_id, title, ingredients_json, steps_json, cuisine, difficulty, confidence
```

## API Surface
- `POST /api/shared/import` — receives any shared food-related URL/media reference from the extension and classifies route
- `POST /api/recipes/import` — recipe-specific import route when the caller already knows the content is recipe-like
- `GET /api/recipes/import/:jobId` — poll status (or push via notification when complete)
- `GET /api/recipes/:id` — retrieve a completed recipe

## What This Folder Depends On
- `05-orchestrator` — completed recipes written to user's recipe library in Orchestrator DO SQLite
- `03-foundation` — Upstash Workflow runs the multi-step import job (fetch → extract → normalize → store); share-sheet extension is a native iOS/Android target registered in the Cloudflare Worker
- `06-memory-engine` — `recipes`, `memory_event`, and session context schema
- `07-scanner` — screenshot/OCR ingestion reuses server-side image OCR patterns and confidence caveats
- `08-cooking-session` — imported recipes must be immediately cookable by the cooking agent
- `10-map` — place shares can route to place/map memory rather than recipe import
- `13-receipt-intelligence` — receipt-like shares can route to receipt processing rather than recipe import
- `17-menu-scanning` — menu-like shares can route to menu parsing rather than recipe import

## What Depends On This Folder
- `08-cooking-session` — imported recipes are a primary source for cooking sessions; a recipe imported from TikTok is cookable immediately
- `14-pantry-meal-plan` — imported recipes enter the recipe pool for meal plan generation
- `24-viral-sharing` — share-sheet import is the named acquisition mechanism in the viral growth spec; the "TikTok → Brioela" loop depends on this folder being built
