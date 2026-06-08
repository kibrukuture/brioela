# Wearables — Overview

## What This Folder Covers
Integration with health wearables to enrich food intelligence with actual biometrics rather than population averages. Phase 1: Apple HealthKit (Apple Watch users) and Oura Ring. Phase 2: CGM (Dexcom Stelo, Abbott LibreFreeStyle), Google Health Connect, Whoop, Withings. The CGM integration is the killer feature — personal glucose response to specific foods, correlating scan events with 2-hour glucose windows.

Provider direction: Brioela owns wearable connectors directly. Do not add a third-party health-data aggregation provider unless a separate vendor review proves it is materially better for privacy, coverage, reliability, and user consent. The default UX is connector-based: user taps a provider, grants permissions, and Brioela ingests only summarized allowed data.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-connection-model.md` | device phases, permission model, HealthKit/Oura/CGM/Health Connect boundaries |
| `02-client-aggregation.md` | client-side daily summaries, no raw streaming, sync timing, source attribution |
| `03-memory-routing.md` | `health.*` namespaces, daily summary ingestion, personality promotion rules |
| `04-cgm-food-response.md` | scan-triggered glucose windows, derived metrics, spike-trigger confidence |
| `05-feature-integration.md` | scanner, meal plan, ambient patterns, illness detective, Mira cooking behavior |
| `06-privacy-disconnect.md` | health data privacy, deletion, export, audit, non-medical boundary |

## Specs This Folder Draws From
- `brioela-specs/40-wearables-integration.md` — full wearables spec: device architecture, daily summary shape, memory routing, CGM correlation logic, connection model, privacy rules

## Key Decisions From Specs
- NEVER stream raw sensor data to the DO — client produces one daily summary JSON per device, ~500 bytes
- Client-side aggregation (background task) → daily summary → Brain DO via HTTP on app open
- Memory routing: `health.biometrics`, `health.sleep`, `health.activity`, `health.glucose` namespaces through the Brain memory-write path
- Personality layer: 30+ day sustained patterns only → `user_personality` trait upgrade (not from single day)
- CGM: 2-hour observation window opened on each scan event; 15-min glucose readings during window; derived values (peak, AUC, time-to-peak) stored; raw readings deleted after derivation
- `glucose_meal_window` table in Brain DO SQLite — private, never Supabase
- 3+ CGM correlation events for same product → `spike_trigger` memory fact with confidence
- Disconnect: all `health.*` memory entries sourced from that device deleted on request; derived personality traits flagged for Curator review
- Health data encrypted at rest in DO SQLite — most sensitive data in the entire app
- Current platform docs check: Apple/Dexcom docs were JS-gated from this environment; Oura docs confirm V2/OAuth path; implementation docs here stay at permission/OAuth/aggregation boundaries, not exact SDK calls

## What This Folder Depends On
- `05-brain` — all wearable data routes to Brain DO memory namespaces
- `06-memory-engine` — `user_memory`, `user_personality`, and private CGM tables live in Brain SQLite
- `07-scanner` — CGM correlation triggered by scan events
- `18-ambient-intelligence` — wearable data corroborates ambient wellbeing patterns
- `12-notifications` — any wearable-driven surfacing obeys notification suppression and quiet rules

## What Depends On This Folder
- `14-pantry-meal-plan` — readiness score affects meal complexity suggestions; pre-workout glucose optimization
- `18-ambient-intelligence` — wearable HRV corroborates wellbeing signals from voice
- `16-illness-detective` — Oura body temperature deviation as early illness signal
