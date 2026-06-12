# Status

open

**Harvest not shipped.** Build-guide **36-harvest** is complete (5 files). Zero `harvest_edition` / `harvest_chapter` Brain tables, zero composition alarm handler, zero mobile Harvest viewer, zero share card pre-render pipeline. Cross-feature drafts exist in **52** (grammar render helper), **40** (craft chapter loader), **51** (`harvest_chapter` / `harvest_cover` card types).

# Shipped in repo (docs / cross-refs only)

- [x] `build-guide/36-harvest/` (`00`–`04`) — docs complete
- [x] `brioela-specs/49-harvest.md` — primary spec
- [x] `_records/connections/32-harvest-connections.md` — ledger
- [x] `_records/build-order/33-layer-harvest.md` — layer deps
- [x] `_features/52-generative-grammar/draft/harvest.chapter.document.helper.gap.md` — **52** consumer stub
- [x] `_features/40-growth-mirror/draft/load.craft.chapter.candidate.handler.gap.md` — **40** producer stub
- [x] `_features/51-viral-sharing/draft/` — `harvest_chapter` / `harvest_cover` enum stubs
- [ ] `harvest_edition` + `harvest_chapter` Brain SQLite tables
- [ ] Six-step composition alarm workflow
- [ ] `document_set_json` storage + **52** offline render
- [ ] Per-chapter share card pre-render → R2
- [ ] `harvest_edition_ready` notification trigger
- [ ] Mobile paged viewer + archive shelf
- [ ] Harvest tests

# Blocked by

- **04** brain-foundation — Brain DO migrations, Drizzle spine
- **09** brain-alarm-tools + **14** brain-alarm-dispatch — anniversary alarm schedule/dispatch
- **35** ambient-intelligence — Time Machine candidate archive (gather input)
- **52** generative-grammar — schema, renderer, `renderArtifactStatic` (**G22**)
- **51** viral-sharing — `harvest_*` card types + share transport (**G2**, **G23**)
- **21** platform-notifications — `harvest_edition_ready` send path (**G3**–**G6** platform gaps)
- **40** growth-mirror — optional `craft` chapter only (edition ships without)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `harvest_edition` table | `rg harvest_edition backend/src` — zero |
| G2 | No `harvest_chapter` table | `rg harvest_chapter backend/src` — zero |
| G3 | No `HarvestChapterType` constant | `shared/constants/harvest/` — missing |
| G4 | No anniversary window helper | Account `created_at` → `period_start`/`period_end` not implemented |
| G5 | No 10-week active eligibility check | `01-composition-workflow.md` floor — no code |
| G6 | No gather helpers (scan/recipe/receipt/constraint) | Step 1 — no `gather.harvest` paths |
| G7 | No Time Machine archive reader for annual window | **35** `time_machine_moment` consumer missing for **53** |
| G8 | No chapter candidate builder | Step 2 — seven types not coded |
| G9 | No sensitivity exclusion policy at candidate layer | `02-chapter-rules.md` hard list — no `_policies/harvest/` |
| G10 | No salience ranker | Spec **38** heuristic — no `rank.chapters` helper |
| G11 | No 6-chapter floor enforcement | Abort path untested |
| G12 | No narrative LLM pass | Step 4 — no structured output schema |
| G13 | No grammar compose pass | Step 5 — depends **52** G13 |
| G14 | No `document_set_json` storage | **52** G23 — consumer missing |
| G15 | No share card pre-render pipeline | **52** G22 Artifact Layer + R2 refs |
| G16 | No `compose_harvest_edition` alarm handler | `harvest_edition_compose` alarm kind missing |
| G17 | No week-before-anniversary alarm schedule | **09** tool — no Harvest alarm registration |
| G18 | No `harvest_edition_ready` notification trigger | **21** inventory lists type — no sender |
| G19 | No Harvest API routes/contract | `shared/contracts/harvest.contract.ts` — missing |
| G20 | No mobile Harvest viewer | `mobile/features/harvest/` — missing |
| G21 | No archive shelf UI | Past editions not listable |
| G22 | No per-chapter share button → **51** bridge | `04-share-cards.md` — unwired |
| G23 | **`harvest_chapter` / `harvest_cover` not in shared enum** | **51** G2 — extension types docs-only |
| G24 | No Harvest install attribution tag | **51** G15 — distinct path not built |
| G25 | No `source_queries_json` validation gate | Anti-hallucination rule — no enforcer |
| G26 | No typographic fallback on grammar validation fail | `03-grammar-rendering.md` rule — **52** fallback unwired |
| G27 | No edition delete / content inventory hook | spec **49** Privacy — missing |
| G28 | No Harvest metrics events | Success metrics in spec **49** — not instrumented |
| G29 | No **40** craft chapter wire | `load.craft.chapter.candidate` stub only in **40** draft |
| G30 | No **49** heritage signal gather | Heirloom G39 — heritage chapter unwired |
| G31 | No **41** family audience-level gather | Mesa moments — unwired |
| G32 | No Harvest tests | `rg harvest *.test.ts` — zero |
| G33 | **Spec numbering confusion** | Feature **53** ↔ spec **49**; growth mirror ↔ spec **53** — document in spec.md |
| G34 | **Food Time Machine spec **38** vs feature **38**** | Time Machine in **35**; negative-space in feature **38** folder |
| G35 | Connections ledger `32` minimal | No session log for Harvest guide completion |
| G36 | No `tools/harvest/` Brain tools | spec **49** namespace — not started |
| G37 | Free-tier quiet upsell line not specified in code | At most one line — copy/rules TBD at implementation |
| G38 | Cover card vs chapter card surface split | **52** `harvest_cover_*` + `harvest_chapter_*` — enum draft only |

# 53 vs neighbor boundaries

| In **53** (this feature) | In separate feature |
|---|---|
| Annual gather/compose/salience/narrative | Time Machine weekly queue (**35** / spec **38**) |
| `harvest_edition` / `harvest_chapter` tables | Grammar schema + renderer (**52**) |
| `document_set_json` compose + store | `renderArtifactStatic` implementation (**52**) |
| Chapter headline/body + `source_queries_json` | Discovery Card scrub (**51** — N/A; excluded at compose) |
| Share card pre-render trigger + R2 refs | Share sheet transport + attribution (**51**) |
| `harvest_edition_ready` trigger payload | Push send infrastructure (**21**) |
| Optional `craft` chapter selection | Skill evidence + trajectories (**40**) |
| Heritage/family chapter gather | Heirloom capture (**49**), Mesa (**41**) |
| Anniversary eligibility floors | Account creation date (**03** auth) |
| Weekly summary | **34** — different cadence; explicitly not diluted |

# Sources

- `brioela-specs/49-harvest.md`
- `build-guide/36-harvest/`
- `brioela-specs/38-food-time-machine.md`
- `brioela-specs/42-brioela-generative-grammar.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- `brioela-specs/23-ambient-notification-strategy.md`
- `brioela-specs/53-growth-mirror.md`
- `build-guide/18-ambient-intelligence/04-food-time-machine.md`
- `build-guide/40-growth-mirror/04-recipe-confidence-touch.md`
- `_records/connections/32-harvest-connections.md`
- `_records/build-order/33-layer-harvest.md`
- Neighbor `_features/35-ambient-intelligence/`, `40-growth-mirror/`, `51-viral-sharing/`, `52-generative-grammar/`, `21-platform-notifications/`, `34-pantry-meal-plan/`, `43-pricing-tiers/`, `49-heirloom/`
