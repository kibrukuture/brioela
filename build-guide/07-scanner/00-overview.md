# Scanner — Overview

## What This Folder Covers

The core product loop: point camera at a product, get a verdict in under 3 seconds. Barcode decode (on-device), product resolution (Open Food Facts + gov DBs + Redis cache), constraint check against the user's Orchestrator DO, scan result UI (compact + expanded), GPT-4o mini vision fallback when no barcode, boycott filter enforcement, and origin/supply chain display. Scanning is always free — never paywalled.

Note: restaurant menu scanning has its own folder (`17-menu-scanning`) and reuses the GPT-4o mini vision extraction pattern from this folder.

## Status
[x] complete — seven files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-barcode-decode.md` | On-device barcode detection (Expo Camera), UPC extraction, offline behavior, backend route entry point, Supabase scan_events write, dual write to Orchestrator DO memory_event |
| `02-product-resolution.md` | Evidence-weighted product graph, parallel fan-out to approved sources (GS1 + Open Food Facts + USDA + country public databases + commercial fallback), field-level confidence, allergen fail-safe resolution, GPT-4o mini label evidence, conflict detection, confidence-based UI treatment |
| `03-constraint-check.md` | check-constraint tool inside Orchestrator DO, ingredient synonym resolution, five constraint type behaviors (block/warn/deprioritize/boycott/clear), medication-food interaction check via user_memory.health.medications, community health signal overlay, fail-open rule |
| `04-scan-result-ui.md` | Verdict structure schema, base health score computation (rule-based), green/yellow/red verdict logic, compact result layout, hard allergy interrupt pattern, expanded result, boycott display, origin display, follow-up actions, free tier rule |
| `05-gpt4o-mini-vision-fallback.md` | Vision fallback trigger (3s timeout), server-side GPT-4o mini extraction, contrast enhancement, confidence schema, synthetic product construction, menu scanning pattern reuse |
| `06-product-data-provenance-correction.md` | Source priority, product fact provenance, label evidence, correction flow, safety boundary |
| `07-community-product-intelligence.md` | Eight anonymized Postgres tables (cohorts, exposure-event associations, ingredient event association index, product community health summary, medication-food event associations, time-of-day event patterns, regional event patterns, research association candidates), flywheel mechanics, community signals feeding back into constraint check |

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
- GPT-4o mini vision fallback triggers after 3s of no barcode detection — automatic, no user action
- Vision extraction confidence below 0.4 → scan fails gracefully with actionable message
- Scanning is always free regardless of tier (spec 19 non-negotiable rule)
- Product facts must carry provenance; user corrections require label/URL evidence and safety-impacting corrections need review.

## Unified Scan Experience

The scanner must feel like one product judgment, not a stack of separate modules. Product resolution,
fact provenance, private constraints, medication-food checks, origin/supply-chain context, and
anonymous community evidence all feed one computation that returns one primary verdict.

The user should never feel like Brioela fetched a database score, then separately bolted on medication
logic, then separately bolted on community notes. Those are evidence layers inside a single scan
decision.

Runtime spine:

```text
scan input
→ resolve product identity
→ build resolved product fact snapshot
→ attach product fact evidence and confidence
→ load origin / parent-company context
→ load cached product community health summary
→ call Orchestrator DO for personal constraints and medication-food checks
→ read cached ingredient event association signals relevant to the user profile
→ build one verdict
→ return one scan result payload
```

Primary result:

```text
YELLOW
Worth caution for your profile.
```

Expanded details can explain the layers separately:

```text
Product facts: contains MSG.
Your profile: hypertension.
Community evidence: similar anonymous profiles reported headaches more often after products containing MSG.
Origin: manufactured in X, parent company Y.
Evidence confidence: ingredient list from label photo + Open Food Facts, medium confidence.
```

Origin, boycott, recall, label confidence, and community evidence remain distinct data surfaces. The
experience is still unified: one scan, one verdict, one explanation hierarchy.

## Tools Built In This Feature

Under `tools/product-scan/`:
- `check-constraint.ts` — checks product against constraints + medications inside Orchestrator DO
- `log-scan-event.ts` — writes scan event to Orchestrator DO memory_event table

## What This Folder Depends On

- `05-orchestrator` — constraint profile (constraints table), user_memory.health.medications, memory_event write
- `06-memory-engine` — memory_event schema, user_memory schema
- `03-foundation` — Supabase for scan_events and products tables, Upstash Redis for product cache

## What Depends On This Folder

- `09-ground` — find-from-scan flow links back to scan_event
- `15-recall-alerts` — matches government recalls against scan_event history in Supabase
- `11-bela` — constraint enforcement on shopper's scanner reuses check-constraint tool
- `16-illness-detective` — scan history in memory_event is the food window for illness investigation
- `17-menu-scanning` — reuses vision extraction pattern (enhance.image.helper.ts, GPT-4o mini structured extraction)
