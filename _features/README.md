# Features

Numbered folders sort in **build order**: lower number = heavier foundation, build first.

Each feature folder holds (or will hold):

- `spec.md` — behavior contract
- `build.md` — file list + acceptance (no code)
- `status.md` — open / partial / shipped + blocked-by
- `draft/` — production code snapshots for review

Cross-cutting rules live in `00-patterns/` (not a shippable feature).

Old docs (`implementable-specs/`, `build-guide/`, ledgers) migrate here one feature at a time. Do not delete source docs until that feature is fully migrated and approved.

**Numbering note:** Slots **04** and **05** are unused (removed legacy). Do not recreate them. Brain chain starts at **06**.

---

## Index (build order)

| # | Folder | Area |
|---|---|---|
| 00 | `00-patterns` | Cross-cutting patterns (not shippable) |
| 01 | `01-platform-foundation` | Monorepo, backend shell, shared packages |
| 02 | `02-platform-design-system` | Design system |
| 03 | `03-platform-auth-onboarding` | Auth + onboarding |
| — | *(04–05 removed)* | — |
| 06 | `06-brain-foundation` | Brain DO, Drizzle spine, migration runtime |
| 07 | `07-brain-memory-tools` | Memory event + user memory tools |
| 08 | `08-brain-skill-tools` | Skill CRUD tools |
| 09 | `09-brain-constraint-tools` | Constraint tools |
| 10 | `10-brain-recipe-tools` | Recipe tools |
| 11 | `11-brain-alarm-tools` | Alarm schedule/cancel tools |
| 12 | `12-brain-agent-identity` | Agent identity prompt |
| 13 | `13-brain-sessions-lifecycle` | Session open/close lifecycle |
| 14 | `14-brain-sub-agents` | Maintenance, behavior pattern, compressor |
| 15 | `15-brain-session-compression` | Session context compression |
| 16 | `16-brain-alarm-dispatch` | Alarm dispatch handler |
| 17 | `17-brain-system-prompt` | System prompt builder |
| 18 | `18-brain-session-tools` | Session-facing brain tools |
| 19 | `19-brain-vectorize` | Vectorize integration |
| 20 | `20-brain-web-search` | Web search tool |
| 21 | `21-brain-tool-registry` | Tool protocol + registry |
| 22 | `22-brain-chat-runtime` | Live chat / Mira session handler |
| 23 | `23-platform-notifications` | Push notifications |
| 24 | `24-health-intelligence` | Health intelligence |
| 25 | `25-medical-conditions` | Medical conditions |
| 26 | `26-scanner` | Product scanner |
| 27 | `27-recipe-ingestion` | Recipe ingestion |
| 28 | `28-menu-scanning` | Menu scanning |
| 29 | `29-ground` | Ground |
| 30 | `30-map` | Healthy food map |
| 31 | `31-cooking-session` | Cooking session |
| 32 | `32-mira-speech-engine` | Mira speech |
| 33 | `33-recall-alerts` | Recall alerts |
| 34 | `34-illness-detective` | Illness detective |
| 35 | `35-receipt-intelligence` | Receipt intelligence |
| 36 | `36-pantry-meal-plan` | Pantry + meal plan |
| 37 | `37-ambient-intelligence` | Ambient intelligence |
| 38 | `38-wearables` | Wearables |
| 39 | `39-craving-decoder` | Craving decoder |
| 40 | `40-negative-space-nutrition` | Negative space nutrition |
| 41 | `41-acoustic-cooking` | Acoustic cooking |
| 42 | `42-growth-mirror` | Growth mirror |
| 43 | `43-mesa` | Mesa |
| 44 | `44-bela` | Bela |
| 45 | `45-pricing-tiers` | Pricing tiers |
| 46 | `46-kids-mode` | Kids mode |
| 47 | `47-in-store-copilot` | In-store copilot |
| 48 | `48-verified-profiles` | Verified profiles |
| 49 | `49-passport` | Passport |
| 50 | `50-encore` | Encore |
| 51 | `51-heirloom` | Heirloom |
| 52 | `52-kin` | Kin |
| 53 | `53-viral-sharing` | Viral sharing |
| 54 | `54-generative-grammar` | Generative grammar |
| 55 | `55-harvest` | Harvest |
| 56 | `56-tonight` | Tonight |

**Migration status (docs only):** fully migrated — `06-brain-foundation`, `07-brain-memory-tools`. All others: stub `status.md` unless noted.
