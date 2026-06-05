# Ambient Intelligence — Overview

## What This Folder Covers
The background intelligence layer that makes Brioela feel alive without the user doing anything. Four features that run on the DO alarm cycle and surface insights conversationally (never as dashboards): behavioral food pattern detection (energy correlations, stress eating, dietary drift), pre-trip food intelligence (destination map pre-load from travel intent), food time machine (personal food history surfaced as emotionally resonant moments), and guest mode (temporary constraint layering when cooking for others).

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/17-behavioral-food-pattern-detection.md` — passive pattern detection, wellbeing signals from voice sessions, energy correlations, intervention surfaced conversationally never as dashboard
- `brioela-specs/22-pre-trip-food-intelligence.md` — travel intent detection (voice/calendar/map search), destination pre-load via QStash job, location switch on arrival
- `brioela-specs/38-food-time-machine.md` — ambient surfacing at scan/recipe/weekly summary moments; milestone moments (not gamification); computed in weekly alarm cycle
- `brioela-specs/37-guest-and-cooking-for-others.md` — conversational guest mode activation, temporary constraint layering, archive-to-memory promotion after repeated patterns

## Key Decisions From Specs
- No explicit data collection — all signals captured from existing interactions (scans, receipts, voice sessions)
- No mood tracker UI, no logging prompts, no dashboards — insights surface in natural conversation
- Behavioral patterns: minimum 5 consistent signal instances before pattern is written; surfaced once per week max
- Wellbeing signals: captured from voice transcript by Orchestrator DO — `energy_low`, `energy_high`, `stomach_discomfort`, etc.
- Food Time Machine: computed in weekly alarm cycle → candidate queue of 5-10 moments; drawn from at scan/recipe/summary moments
- Guest mode: activated by voice ("my sister is coming for dinner, she's vegan") — no settings screen; constraints layered on top, never replacing user's own profile
- Guest session archive: promoted to user_memory via AI judgment after 4+ sessions with overlapping constraints
- All four run on the same DO alarm cycle (7-day interval, 2-hour idle check) — no separate infrastructure

## What This Folder Depends On
- `05-orchestrator` — all patterns stored in Orchestrator DO SQLite; alarm system powers all four features
- `07-cooking-session` — wellbeing signals captured from cooking session transcripts
- `09-map` — travel pre-load writes to Upstash Redis geo cache, Mapbox switches context on arrival

## What Depends On This Folder
Nothing — terminal ambient layer.
