# Scanner — Overview

## What This Folder Covers

The core product loop: point camera at a product, get a verdict in under 3 seconds. Barcode decode (on-device), product resolution (Open Food Facts + gov DBs + Redis cache), constraint check against the user's Orchestrator DO, scan result UI (compact + expanded), OCR fallback when no barcode, boycott filter enforcement, and origin/supply chain display. Scanning is always free — never paywalled.

Note: restaurant menu scanning has its own folder (`14-menu-scanning`) and reuses the OCR pipeline from this folder.

## Status
[x] complete — five files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-barcode-decode.md` | On-device barcode detection (Expo Camera), UPC extraction, offline behavior, backend route entry point, Supabase scan_events write, dual write to Orchestrator DO memory_event |
| `02-product-resolution.md` | Three-layer resolution stack (Redis → Supabase → external APIs), Open Food Facts, country-specific gov DBs, canonical products table schema, product_origin table, pending scan queue for unresolved UPCs |
| `03-constraint-check.md` | check-constraint tool inside Orchestrator DO, ingredient synonym resolution, five constraint type behaviors (block/warn/deprioritize/boycott/clear), drug-food interaction check via user_memory.health.medications, fail-open rule, proposed constraint surfacing after scan |
| `04-scan-result-ui.md` | Verdict structure schema, base health score computation (rule-based, no LLM), green/yellow/red verdict logic, compact result layout, hard allergy interrupt pattern, expanded result, boycott display, origin display, follow-up actions (Save/Note/Map/Avoid/Share), free tier rule |
| `05-ocr-fallback.md` | OCR trigger (3s timeout), server-side Gemini Vision call, contrast enhancement with sharp, confidence schema and UI treatment, synthetic product construction from OCR data, menu scanning pipeline reuse, full folder structure |

## Specs This Folder Draws From

- `brioela-specs/01-product-health-scanning.md` — scan flow, 3s latency target, verdict structure, API surface, data model
- `brioela-specs/05-origin-supply-chain-and-boycott-filters.md` — boycott rules, origin display, product_origin versioning
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md` — hard allergy interrupt, soft dislike ranking, dietary identity, ingredient synonym resolution
- `brioela-specs/19-pricing-and-tiers.md` — scanning is ALWAYS free, unlimited, non-negotiable

## Key Decisions From Specs

- Barcode decode on-device — no network required for UPC extraction
- scan_events written to Supabase (shared) for recall cross-referencing, AND to Orchestrator DO memory_event (private) for illness detective
- Redis cache key `product:{upc}` with 7-day TTL — cache hit path under 500ms
- Constraint check calls Orchestrator DO via `/internal/check-constraints` — all user-private data stays in DO
- hard_allergy blocks scan result with explicit interrupt; user must tap through
- Fail open: constraint check failure returns 'clear' — scanning never blocked by technical failure
- Base health score is rule-based (additives, nutrients, ingredient count) — no LLM in scoring path
- OCR triggers after 3s of no barcode detection — automatic, no user action
- OCR confidence below 0.4 → scan fails gracefully with actionable message
- Scanning is always free regardless of tier (spec 19 non-negotiable rule)

## Tools Built In This Feature

Under `tools/product-scan/`:
- `check-constraint.ts` — checks product against constraints + medications inside Orchestrator DO
- `log-scan-event.ts` — writes scan event to Orchestrator DO memory_event table

## What This Folder Depends On

- `05-orchestrator` — constraint profile (constraints table), user_memory.health.medications, memory_event write
- `06-memory-engine` — memory_event schema, user_memory schema
- `03-foundation` — Supabase for scan_events and products tables, Upstash Redis for product cache

## What Depends On This Folder

- `08-ground` — find-from-scan flow links back to scan_event
- `12-recall-alerts` — matches government recalls against scan_event history in Supabase
- `09-bela` — constraint enforcement on shopper's scanner reuses check-constraint tool
- `13-illness-detective` — scan history in memory_event is the food window for illness investigation
- `14-menu-scanning` — reuses OCR pipeline (enhance.image.helper.ts, Gemini Vision pattern)
