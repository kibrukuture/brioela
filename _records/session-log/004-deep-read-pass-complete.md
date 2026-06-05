# Session 004 — Full Deep Read Pass + Gap Fixes

## Date
2026-06-05

## Completed this session
- Read every single spec file across all 112 files (all 41 brioela-specs + all implementable-specs)
- Cross-referenced every spec against every build-guide overview file
- Identified one genuinely missing feature folder, two ownership conflicts in existing overviews

## What was found and fixed

### Missing feature folder (created)
- **`build-guide/16-recipe-ingestion/`** — was completely absent from the build-guide
  - Source spec: `brioela-specs/02-recipe-ingestion-from-shared-content.md`
  - Covers: share-sheet extension (iOS/Android), URL ingestion, video transcript extraction, recipe normalization, confidence schema, async Upstash Workflow job
  - Key fact: spec 20 calls the share-sheet extension "the single most important distribution mechanism after organic scanning" — this is not a minor feature
  - Created: `build-guide/16-recipe-ingestion/00-overview.md`

### Conflict fixes (two overview files corrected)
- **`build-guide/05-scanner/00-overview.md`** — was incorrectly claiming restaurant menu scanning (spec 27). That spec is owned by `14-menu-scanning`. Removed the claim; added a note that 14-menu-scanning uses the scanner's OCR pipeline as a dependency.
- **`build-guide/09-map/00-overview.md`** — was incorrectly claiming pre-trip food intelligence (spec 22). That spec is owned by `15-ambient-intelligence`. Changed to a dependency reference: ambient intelligence pre-loads geo-cached data; the map displays it on arrival.

## Complete spec-to-folder mapping (authoritative)

| Spec | Owner folder |
|---|---|
| 00 philosophy | 01-design-system, 02-coding-standards |
| 01 health scanning | 05-scanner |
| 02 recipe ingestion | **16-recipe-ingestion** (created this session) |
| 03 deprecated | (superseded by Ground/35 — no folder needed) |
| 04 healthy food map | 09-map |
| 05 origin/boycott | 05-scanner |
| 06 receipt intelligence | 10-receipt-intelligence |
| 07 allergy/dietary guardrails | 05-scanner |
| 08 memory engine | 06-memory-engine |
| 09 orchestrator | 05-orchestrator |
| 10 voice cooking | 07-cooking-session |
| 11 vision cooking | 07-cooking-session |
| 12 multi-person rooms | 07-cooking-session |
| 13 generational recipe capture | 07-cooking-session |
| 14 pantry rescue | 11-pantry-meal-plan |
| 15 hyperlocal price alerts | 09-map |
| 16 weekly food summary | 11-pantry-meal-plan |
| 17 behavioral patterns | 15-ambient-intelligence |
| 18 verified profiles | 20-verified-profiles |
| 19 pricing tiers | 23-pricing-tiers |
| 20 platform distribution | 03-foundation |
| 21 onboarding | 04-auth-and-onboarding |
| 22 pre-trip intelligence | 15-ambient-intelligence |
| 23 notification strategy | 10-notifications |
| 24 technical architecture | 03-foundation |
| 25 viral sharing | 21-viral-sharing |
| 26 recall alerts | 12-recall-alerts |
| 27 menu scanning | 14-menu-scanning |
| 28 medical conditions | 19-medical-conditions |
| 29 inflation tracker | 10-receipt-intelligence |
| 30 illness detective | 13-illness-detective |
| 31 kids mode | 18-kids-mode |
| 32 grandma style profile | 07-cooking-session |
| 33 minimum spend meal plan | 11-pantry-meal-plan |
| 34 universal visual intake | 06-memory-engine |
| 35 Ground | 08-ground |
| 35b Ground deep design | 08-ground |
| 36 predictive pantry | 11-pantry-meal-plan |
| 37 guest mode | 15-ambient-intelligence |
| 38 food time machine | 15-ambient-intelligence |
| 39 generative UI | 01-design-system |
| 40 wearables | 17-wearables |
| implementable-specs/ tables 01-12 | 05-orchestrator + 06-memory-engine |
| implementable-specs/15-curator | 06-memory-engine |
| implementable-specs/16-agent-identity | 05-orchestrator |
| implementable-specs/17-session-lifecycle | 05-orchestrator |
| implementable-specs/18-vectorize | 06-memory-engine |
| implementable-specs/brioela-tools/ | 07-cooking-session (tools/) |
| implementable-specs/cooking-session/ | 07-cooking-session |
| implementable-specs/bela/ | 09-bela |

## Total build-guide folders now: 25

```
01-design-system
02-coding-standards
03-foundation
04-auth-and-onboarding
05-orchestrator
05-scanner
06-memory-engine
07-cooking-session
08-ground
09-bela
09-map
10-notifications
10-receipt-intelligence
11-pantry-meal-plan
12-recall-alerts
13-illness-detective
14-menu-scanning
15-ambient-intelligence
16-recipe-ingestion   ← new this session
17-wearables
18-kids-mode
19-medical-conditions
20-verified-profiles
21-viral-sharing
23-pricing-tiers
```

## In progress
Nothing half-done.

## What is next
All 25 feature folders now have accurate overview files. The spec-to-folder mapping is complete and conflict-free. Ready to begin building features one at a time in dependency order:

Build order (dependency layers):
1. `01-design-system` — requires web research first (React Native fonts, motion, generative UI maturity)
2. `02-coding-standards`
3. `03-foundation`
4. `04-auth-and-onboarding`
5. `05-orchestrator` (critical path — everything depends on this)
6. `06-memory-engine`
7. Then: `05-scanner`, `16-recipe-ingestion`, `07-cooking-session`, `08-ground`, `09-map`, `10-receipt-intelligence`, `10-notifications`, `11-pantry-meal-plan`, `12-recall-alerts`, `13-illness-detective`, `14-menu-scanning`, `15-ambient-intelligence`, `17-wearables`, `18-kids-mode`, `19-medical-conditions`, `20-verified-profiles`, `21-viral-sharing`, `23-pricing-tiers`
8. `09-bela` (last — depends on nearly everything)

## Blockers
None. Build-guide is now complete and accurate. Start with `01-design-system` web research pass.
