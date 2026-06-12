# Features

Numbered folders sort in **build order**: lower number = heavier foundation, build first.

Each feature folder holds (or will hold):

- `spec.md` — behavior contract
- `build.md` — file list + acceptance (no code)
- `status.md` — open / partial / shipped + blocked-by
- `draft/` — production code snapshots for review

Cross-cutting rules live in `00-patterns/` (not a shippable feature).

Old docs (`implementable-specs/`, `build-guide/`, ledgers) migrate here one feature at a time. Do not delete source docs until that feature is fully migrated and approved.

---

## Index (build order)

| # | Folder | Area |
|---|---|---|
| 00 | `00-patterns` | Cross-cutting patterns (not shippable) |
| 01 | `01-platform-foundation` | Monorepo, backend shell, shared packages |
| 02 | `02-platform-design-system` | Design system |
| 03 | `03-platform-auth-onboarding` | Auth + onboarding |
| 04 | `04-brain-foundation` | Brain DO, Drizzle spine, migration runtime |
| 05 | `05-brain-memory-tools` | Memory event + user memory tools |
| 06 | `06-brain-skill-tools` | Skill CRUD tools |
| 07 | `07-brain-constraint-tools` | Constraint tools |
| 08 | `08-brain-recipe-tools` | Recipe tools |
| 09 | `09-brain-alarm-tools` | Alarm schedule/cancel tools |
| 10 | `10-brain-agent-identity` | Agent identity prompt |
| 11 | `11-brain-sessions-lifecycle` | Session open/close lifecycle |
| 12 | `12-brain-sub-agents` | Maintenance, behavior pattern, compressor |
| 13 | `13-brain-session-compression` | Session context compression |
| 14 | `14-brain-alarm-dispatch` | Alarm dispatch handler |
| 15 | `15-brain-system-prompt` | System prompt builder |
| 16 | `16-brain-session-tools` | Session-facing brain tools |
| 17 | `17-brain-vectorize` | Vectorize integration |
| 18 | `18-brain-web-search` | Web search tool |
| 19 | `19-brain-tool-registry` | Tool protocol + registry |
| 20 | `20-brain-chat-runtime` | Live chat / Mira session handler |
| 21 | `21-platform-notifications` | Push notifications |
| 22 | `22-health-intelligence` | Health intelligence |
| 23 | `23-medical-conditions` | Medical conditions |
| 24 | `24-scanner` | Product scanner |
| 25 | `25-recipe-ingestion` | Recipe ingestion |
| 26 | `26-menu-scanning` | Menu scanning |
| 27 | `27-ground` | Ground |
| 28 | `28-map` | Healthy food map |
| 29 | `29-cooking-session` | Cooking session |
| 30 | `30-mira-speech-engine` | Mira speech |
| 31 | `31-recall-alerts` | Recall alerts |
| 32 | `32-illness-detective` | Illness detective |
| 33 | `33-receipt-intelligence` | Receipt intelligence |
| 34 | `34-pantry-meal-plan` | Pantry + meal plan |
| 35 | `35-ambient-intelligence` | Ambient intelligence |
| 36 | `36-wearables` | Wearables |
| 37 | `37-craving-decoder` | Craving decoder |
| 38 | `38-negative-space-nutrition` | Negative space nutrition |
| 39 | `39-acoustic-cooking` | Acoustic cooking |
| 40 | `40-growth-mirror` | Growth mirror |
| 41 | `41-mesa` | Mesa |
| 42 | `42-bela` | Bela |
| 43 | `43-pricing-tiers` | Pricing tiers |
| 44 | `44-kids-mode` | Kids mode |
| 45 | `45-in-store-copilot` | In-store copilot |
| 46 | `46-verified-profiles` | Verified profiles |
| 47 | `47-passport` | Passport |
| 48 | `48-encore` | Encore |
| 49 | `49-heirloom` | Heirloom |
| 50 | `50-kin` | Kin |
| 51 | `51-viral-sharing` | Viral sharing |
| 52 | `52-generative-grammar` | Generative grammar |
| 53 | `53-harvest` | Harvest |
| 54 | `54-tonight` | Tonight |

**Migration status (docs only):** fully migrated — `04-brain-foundation`, `05-brain-memory-tools`, `06-brain-skill-tools`, `07-brain-constraint-tools`, `08-brain-recipe-tools`, `09-brain-alarm-tools`, `10-brain-agent-identity`, `11-brain-sessions-lifecycle`, `12-brain-sub-agents`, `13-brain-session-compression`, `14-brain-alarm-dispatch`, `15-brain-system-prompt`, `16-brain-session-tools`, `17-brain-vectorize`, `18-brain-web-search`. All others: stub `status.md` unless noted.
