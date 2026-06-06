# Session 006 — Memory Engine Build Guide Complete

## Date
2026-06-06

## Completed This Session

Full spec read pass before writing (no rushing):
- implementable-specs/01-memory-event.md through 12-schema-version.md (all 12 table specs)
- implementable-specs/15-curator.md (CuratorAgent + PatternDetectionAgent)
- implementable-specs/18-vectorize.md (Vectorize integration)
- brioela-specs/34-universal-visual-intake.md
- brioela-specs/08-personal-food-memory-engine.md

Written — `build-guide/06-memory-engine/`:
- `00-overview.md` — updated to [x] complete, all four files listed
- `01-sqlite-schema.md` — all 12 tables: CREATE TABLE SQL, Drizzle schema, column decisions, indexes, write/read rules, DO startup sequence
- `02-curator-passes.md` — CuratorAgent three passes (skill maintenance with mass-archive guard, trait decay with strength delta rules, trait inference), PatternDetectionAgent behavioral pass
- `03-vectorize.md` — Cohere multilingual, 20-shard structure, wrangler.jsonc bindings, fire-and-forget embedding, semantic query, failure handling, account setup checklist
- `04-visual-intake.md` — Gemini vision call, VisualIntakeOutputSchema, memory routing table, medication chain, stool Bristol Scale, discard rules

Written — `_records/connections/06-memory-engine-connections.md`

## Inventory Status Changes

Mark as [x] in inventory.md:
- implementable-specs/02-user-memory.md → [x]
- implementable-specs/03-user-personality.md → [x]
- implementable-specs/04-skills.md → [x]
- implementable-specs/05-skill-versions.md → [x]
- implementable-specs/06-constraints.md → [x]
- implementable-specs/07-sessions.md → [x]
- implementable-specs/08-session-turns.md → [x]
- implementable-specs/09-recipes.md → [x]
- implementable-specs/10-scheduled-alarms.md → [x]
- implementable-specs/11-agent-state.md → [x]
- implementable-specs/12-schema-version.md → [x]
- implementable-specs/18-vectorize.md → [x]
- brioela-specs/34-universal-visual-intake.md → [x]
- brioela-specs/08-personal-food-memory-engine.md → [x]
- implementable-specs/15-curator.md → [x] (was already in orchestrator connections, now fully documented)

## In Progress
Nothing half-done.

## What Is Next

`07-scanner/` — the core product loop. Files to write:
- `01-barcode-decode.md` — on-device barcode detection, UPC extraction, offline-first
- `02-product-resolution.md` — Open Food Facts + gov DBs, Upstash Redis cache, pending scan queue
- `03-constraint-check.md` — check product against Orchestrator DO constraints + user_memory.medications
- `04-scan-result-ui.md` — green/yellow/red verdict, one-sentence reason, expand-on-demand, boycott display
- `05-ocr-fallback.md` — when no barcode: OCR + image classification, confidence schema

Source specs to read before writing 07-scanner:
- `brioela-specs/01-product-health-scanning.md` — scan flow, latency target, verdict structure
- `brioela-specs/05-origin-supply-chain-and-boycott-filters.md` — boycott rules, origin display
- `brioela-specs/07-allergy-dislike-and-dietary-guardrails.md` — allergy interrupt, soft dislike ranking

## Blockers
None.
