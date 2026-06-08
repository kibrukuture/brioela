# Ambient Intelligence — Overview

## What This Folder Covers
The background intelligence layer that makes Brioela feel alive without the user doing anything. Four features that run on the DO alarm cycle and surface insights conversationally (never as dashboards): behavioral food behavior pattern detection (energy correlations, stress eating, dietary drift), pre-trip food intelligence (destination map pre-load from travel intent), food time machine (personal food history surfaced as emotionally resonant moments), and guest mode (temporary constraint layering when cooking for others).

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-ambient-alarm-loop.md` | shared DO alarm cadence, idle rules, candidate queues, no separate cron |
| `02-behavioral-patterns.md` | passive wellbeing signals, correlation rules, intervention thresholds |
| `03-pre-trip-food-intelligence.md` | travel intent detection, QStash preload, destination cache activation |
| `04-food-time-machine.md` | private historical moments, candidate ranking, inline surfacing |
| `05-guest-mode.md` | temporary guest constraints, active layering, archive and memory promotion |
| `06-surfacing-and-privacy.md` | conversation-first surfacing, notification boundaries, privacy rules |

## Specs This Folder Draws From
- `brioela-specs/17-behavioral-food-pattern-detection.md` — passive behavior pattern detection, wellbeing signals from voice sessions, energy correlations, intervention surfaced conversationally never as dashboard
- `brioela-specs/22-pre-trip-food-intelligence.md` — travel intent detection (voice/calendar/map search), destination pre-load via QStash job, location switch on arrival
- `brioela-specs/38-food-time-machine.md` — ambient surfacing at scan/recipe/weekly summary moments; milestone moments (not gamification); computed in weekly alarm cycle
- `brioela-specs/37-guest-and-cooking-for-others.md` — conversational guest mode activation, temporary constraint layering, archive-to-memory promotion after repeated patterns

## Key Decisions From Specs
- No explicit data collection — all signals captured from existing interactions (scans, receipts, voice sessions)
- No mood tracker UI, no logging prompts, no dashboards — insights surface in natural conversation
- Behavioral patterns: minimum 5 consistent signal instances before pattern is written; surfaced once per week max
- Wellbeing signals: captured from voice transcript by Brain DO — `energy_low`, `energy_high`, `stomach_discomfort`, etc.
- Food Time Machine: computed in weekly alarm cycle → candidate queue of 5-10 moments; drawn from at scan/recipe/summary moments
- Guest mode: activated by voice ("my sister is coming for dinner, she's vegan") — no settings screen; constraints layered on top, never replacing user's own profile
- Guest session archive: promoted to user_memory via AI judgment after 4+ sessions with overlapping constraints
- All four run through the same Brain DO alarm system with feature-specific cadence and idle checks — no separate infrastructure
- Travel preload can use menu intelligence when available, but destination verdicts are still recomputed from the user's private profile

## What This Folder Depends On
- `05-brain` — all patterns stored in Brain DO SQLite; alarm system powers all four features
- `07-scanner` — scan events feed behavioral patterns and Time Machine moments
- `08-cooking-session` — wellbeing signals captured from cooking session transcripts
- `13-receipt-intelligence` — receipt history feeds dietary drift, spend, and food-history signals
- `12-notifications` — interruption rules and in-app ambient surfaces
- `10-map` — travel pre-load writes to Upstash Redis geo cache, Mapbox switches context on arrival
- `17-menu-scanning` — destination restaurant/menu fit can be preloaded when shared menu intelligence exists

## What Depends On This Folder
- `20-wearables` — later wearable signals can corroborate ambient food/wellbeing patterns
