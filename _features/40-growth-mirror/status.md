# Status

open

**Growth mirror build-guide complete; production is entirely unshipped.** Five `build-guide/40-growth-mirror/` files and spec **53** are done. Zero `skill_evidence` extraction, zero `skill_trajectory` / `growth_recognition` tables, zero Pass 4 maintenance step, zero recognition delivery, zero recipe-confidence touch, zero tests. Host session end (**29**), acoustic `vision_event` (**39**), and BrainMaintenanceAgent (**12**) also unshipped.

# Shipped (partial / docs only)

## Docs & ledgers
- [x] `build-guide/40-growth-mirror/00-overview.md` through `04-recipe-confidence-touch.md`
- [x] `brioela-specs/53-growth-mirror.md`
- [x] `_records/connections/36-growth-mirror-connections.md`
- [x] `_records/build-order/37-layer-growth-mirror.md`
- [x] `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- [x] Cross-refs in spec **17**, **38**, **39** generative UI, **21** notifications
- [x] `_features/40-growth-mirror/spec.md`, `build.md`, `status.md`, `draft/` (this migration)

## Infrastructure partial (not growth-mirror-specific)
- [x] `memory_event` table (**05**/**04**) — no `skill_evidence` writer
- [x] `sessions` / `session_turns` (**04**) — cooking type ready; no session end fiber
- [ ] `vision_event` + `evidence_source` (**39**) — prerequisite for heat-control evidence
- [ ] MiraSession + post-session processing (**29**) — prerequisite extraction hook
- [ ] BrainMaintenanceAgent (**12**) — prerequisite Pass 4 slot

## Not shipped
- [ ] `skill_trajectory` + `growth_recognition` Drizzle schemas + migrations
- [ ] `skill_evidence` payload validator
- [ ] `extractSkillEvidenceFromSession` post-session handler
- [ ] Difficulty normalization helper
- [ ] Owner-attribution filter (multi-person)
- [ ] `runSkillTrajectoryUpdatePass` (BrainMaintenanceAgent Pass 4)
- [ ] Pass 3 cooking-skill exclusion guard in maintenance prompt
- [ ] `growth_recognition` candidate enqueue + expiry
- [ ] `checkGrowthInsightBudget` (weekly family + 2-week growth)
- [ ] Conversational surfacing helpers for Mira
- [ ] On-demand "am I getting better?" builder
- [ ] Recognition dismissal suppression ladder hook
- [ ] `buildDemonstratedSkillSummary` for recipe-card context (**52**)
- [ ] Harvest `craft` chapter candidate loader (**53**)
- [ ] Growth mirror category delete handler
- [ ] Growth mirror tests

# Blocked by

- **29-cooking-session** — session end fiber must exist before post-session extraction
- **39-acoustic-cooking** — `vision_event` acoustic rows for heat-control dimension
- **12-brain-sub-agents** — BrainMaintenanceAgent Pass 4 slot on weekly alarm

# Soft blocked by

- **52-generative-grammar** — recipe-card demonstrated-skill injection (touch can ship as Mira-only first)
- **53-harvest** — optional `craft` chapter consumer (Harvest ships without **40**)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No `skill_trajectory` table** | `rg skill_trajectory backend` — zero |
| G2 | **No `growth_recognition` table** | `rg growth_recognition backend` — zero |
| G3 | **No `skill_evidence` writer** | `memory_event` exists; no kind writer |
| G4 | **No post-session extraction handler** | No `extractSkillEvidence` in backend |
| G5 | **No difficulty normalization** | Spec mandatory — no helper |
| G6 | **No Pass 4 in maintenance** | **12** `_subagents/` absent |
| G7 | **Pass 3 / Pass 4 duplication risk** | **12** Pass 3 could infer cooking-skill traits into `user_personality` — must exclude |
| G8 | **`vision_event` missing** | **39** G3 — blocks heat-control dimension |
| G9 | **Session end fiber missing** | **29** G1 — no hook point |
| G10 | **No insight budget gate** | **35**/**38** family budget not implemented for growth |
| G11 | **No recognition surfacing** | No Mira integration |
| G12 | **No recipe-confidence touch** | No `demonstratedSkillSummary` builder |
| G13 | **No generative grammar consumer** | **52** open — recipe card path absent |
| G14 | **No Harvest craft input** | **53** blocked-by **40** |
| G15 | **No privacy category delete** | Passport delete path absent |
| G16 | **No growth mirror tests** | Zero `growth-mirror*.test.ts` |
| G17 | **`skill_evidence` not in implementable-specs event list** | `01-memory-event.md` — add constant |
| G18 | **Ledger layer vs feature number** | `_records/build-order/37-layer-*` ≠ folder **40** |
| G19 | **Budget spec tension** | Spec **53** says 2-week growth cap + spec **17** says 1/week family — both apply; enforce stricter combined rule |
| G20 | **build-guide/05-brain/04-sub-agents Pass 3 obsolete** | "Memory consolidation flags" vs spec **15** trait inference — **12** migration is authoritative |
| G21 | **06 `skills` vs 40 trajectories name collision** | Different tables/semantics — document at implementation |
| G22 | **32 flavor profile boundary** | `cook_style_profile` ≠ `skill_trajectory`; improvisation shares signal class only |

# 40 vs neighbor boundaries

| In **40** (this feature) | In separate feature |
|---|---|
| `skill_evidence` extraction at session end | Session end fiber shell (**29**) |
| `skill_trajectory` + `growth_recognition` | `user_personality` traits (**12** Pass 3) |
| Pass 4 trajectory maintenance | Pass 1 skill archive (**06** via **12**) |
| Conversational recognition delivery | Push / notification send (**21**) |
| Recipe-confidence context block | Generative grammar renderer (**52**) |
| `craft` chapter candidate export | Harvest composition (**53**) |
| Heat-control evidence *consumption* | `vision_event` *production* (**39**) |
| Insight budget enforcement (growth slice) | Pattern detection (**35**), gap detection (**38**) |
| — | Procedural `skills` CRUD (**06**) |
| — | Grandma `cook_style_profile` (**32**) |
| — | Visible progression UI — **forbidden** |
| — | Standalone reflective cards — **forbidden** |

# Sources

- `brioela-specs/53-growth-mirror.md`
- `brioela-specs/32-grandma-style-flavor-profile.md`
- `brioela-specs/38-food-time-machine.md`
- `brioela-specs/39-generative-ui.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/11-live-vision-cooking-coach.md`
- `brioela-specs/46-acoustic-cooking-intelligence.md`
- `build-guide/40-growth-mirror/` (all 5 files)
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `build-guide/36-harvest/01-composition-workflow.md`, `02-chapter-rules.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `implementable-specs/01-memory-event.md`, `15-brain-maintenance-and-behavior-patterns.md`
- `_records/connections/36-growth-mirror-connections.md`
- `_records/build-order/37-layer-growth-mirror.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/29-cooking-session/`, `39-acoustic-cooking/`, `12-brain-sub-agents/`, `06-brain-skill-tools/`, `21-platform-notifications/`, `35-ambient-intelligence/`, `38-negative-space-nutrition/`, `52-generative-grammar/`, `53-harvest/`
