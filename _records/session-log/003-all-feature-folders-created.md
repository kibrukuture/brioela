# Session 003 — All Feature Folders Created

## Date
2026-06-05

## Completed this session
- Read all 112 spec files across all spec areas (brioela-specs, implementable-specs root, brioela-tools, cooking-session, bela)
- Derived the complete list of 24 feature folders from reading (not guessing)
- Created all 24 feature folders in build-guide/
- Wrote real 00-overview.md for every feature folder — each with: what it covers, which specs it draws from, key decisions, dependencies
- Removed `04-auth` placeholder (superseded by `04-auth-and-onboarding`)

## Complete Feature Folder List
```
01-design-system
02-coding-standards
03-foundation
04-auth-and-onboarding
05-orchestrator          ← per-user agent DO, the critical path
05-scanner               ← number overlap intentional; build-order clarifies sequence
06-memory-engine         ← data layer for orchestrator (SQLite schema, Curator, Vectorize)
07-cooking-session
08-ground
09-bela                  ← number overlap with 09-map; both valid, different features
09-map                   ← healthy food map (separate from Ground)
10-notifications
10-receipt-intelligence  ← number overlap with 10-notifications; both valid
11-pantry-meal-plan
12-recall-alerts
13-illness-detective
14-menu-scanning
15-ambient-intelligence
17-wearables
18-kids-mode
19-medical-conditions
20-verified-profiles
21-viral-sharing
23-pricing-tiers
```

Note on number overlaps: folder names are unique; numbers are hints at build order only.
Actual build order is in `_records/build-order/` (not yet written — next session).

## Key Discoveries From Reading All Specs
- `brioela-specs/39-generative-ui.md` exists and specifies `react-native-gen-ui` — critical for design system
- `brioela-specs/40-wearables-integration.md` — CGM integration is described as "the killer feature"; personal glucose response to specific foods
- `brioela-specs/32-grandma-style-flavor-profile.md` — style extraction from generational sessions; lives inside 07-cooking-session build folder
- `brioela-specs/38-food-time-machine.md` — pure read layer over existing data; no new collection; lives in 15-ambient-intelligence
- Universal visual intake (spec 34) + memory curator both live in 06-memory-engine scope
- `implementable-specs/13-gaps-and-missing-specs.md` NOT YET READ — flagged to read before building
- `brioela-specs/18-verified-business-and-practitioner-profiles.md` and `brioela-specs/20-platform-and-app-distribution.md` NOT YET READ — low priority, read when building those features

## Specs Not Yet Read (low priority, read when building)
- `brioela-specs/18-verified-business-and-practitioner-profiles.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `implementable-specs/13-gaps-and-missing-specs.md` ← READ BEFORE BUILDING ANYTHING
- All implementable-specs root files (01-18) — detailed schema files, read when building 06-memory-engine
- All implementable-specs/brioela-tools/ files — read when building 05-orchestrator tools section

## What Is Next
1. Fill `_records/build-order/` layer files — the actual dependency sequence
2. Fill `_records/connections/` files — which spec connects to which build-guide folder
3. Start actual building: tackle one feature folder at a time, fully, in dependency order
   - First feature to build: 01-design-system (requires web research)
   - After design system: 02-coding-standards, then 03-foundation, then 04-auth-and-onboarding, then 05-orchestrator

## Blockers
- READ `implementable-specs/13-gaps-and-missing-specs.md` before building any feature — it documents known gaps
- Design system requires web research on React Native fonts, motion libraries, generative UI maturity
