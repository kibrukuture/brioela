# Ground — Overview

## What This Folder Covers
The community food intelligence layer. Finds (single time-stamped, location-tagged observations), the 3D Mapbox map (building extrusion, pulsing signal dots, color by signal type, zoom behavior), the AI authenticity gate, voice-to-find flow, haptic walking discovery, find-to-cooking-session triggers, and the personalized relevance scoring for the map. The product is never about the person — the product observation is the center.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-find-data-model.md` | Supabase shared find tables, Orchestrator private find history, status/freshness model |
| `02-authenticity-gate.md` | AI gate checks, rejection handling, media safety, rate limits |
| `03-find-submission-flow.md` | scan-to-find, map-to-find, ambient prompt, voice-to-find, AI-drafted finds |
| `04-map-rendering.md` | Mapbox layers, pulse animation, relevance sizing, zoom behavior, clusters |
| `05-haptic-walking-discovery.md` | optional background discovery haptic, local privacy rules, suppression |
| `06-find-to-cooking-trigger.md` | matching fresh finds to cooking gaps and surfacing cooking actions |

## Specs This Folder Draws From
- `brioela-specs/35-ground-community-intelligence.md` — full Ground spec: find schema, AI gate, map, privacy model, data model
- `brioela-specs/35b-ground-finds-deep-design.md` — deep UX: relevance scoring formula, pulse animation spec, haptic discovery, find-to-cooking trigger, AI-drafted finds from scan context

## Key Decisions From Specs
- Map: Mapbox GL JS (web) and Mapbox Maps SDK (native) — 3D building extrusion, not Google Maps
- Finds are NOT reviews — no star ratings, no likes, no profiles, no following, no gamification
- AI gate: single structured LLM call, <1.5s, 7 checks (specificity, no promotion, no negativity targeting, freshness, no PII, face detection, minimum info density)
- Voice is primary input — audio discarded immediately after transcription (never stored)
- Face detection on images/video: server-side on R2 object before gate decision
- Pulse animation: <2h = fast pulse, 2-7 days = slow pulse, 7-14 days = very faint, >14 days = static dot, >60 days = archived
- Haptic discovery: single pulse within 150m of relevant find — on-device check, no location stored server-side
- Relevance score: `rendered_dot_size = base_size × (1 + relevance_score × 0.8)`
- Contributor identity: hashed user_id stored for abuse only — never displayed
- `location_signal_summary` is the ONLY table queried for map rendering — pre-aggregated, never individual finds

## Tools Built In This Feature
Under `tools/ground/`:
- `submit-find.ts` — submit and gate a find
- `log-find-from-scan.ts` — AI-drafted find triggered by scan context

## What This Folder Depends On
- `05-orchestrator` — user constraint profile for personalized relevance scoring
- `07-scanner` — find-from-scan entry point
- `03-foundation` — Supabase for shared find tables, Cloudflare R2 for media

## What Depends On This Folder
- `10-map` — Ground signals overlay the healthy food map as a separate layer
- `11-bela` — Bela shoppers contribute Ground finds as a side effect of every order; smart routing uses Ground data

## Release Split

- First release: data model, AI gate, manual/AI-drafted find submission, map pulse rendering.
- Later release: haptic walking discovery and find-to-cooking triggers.
