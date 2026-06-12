# Harvest — Build

Feature **53**. Production paths under `backend/src/agents/brain/_schemas/harvest.*.ts`, `backend/src/agents/brain/_handlers/harvest/`, `backend/src/agents/brain/_helpers/harvest/`, `backend/src/agents/brain/_policies/harvest/`, `backend/src/agents/brain/tools/harvest/`, `shared/constants/harvest/`, `shared/validator/harvest/`, `shared/routes/harvest.routes.ts`, `shared/contracts/harvest.contract.ts`, `backend/src/api/harvest/`, `mobile/features/harvest/`, `mobile/network/harvest/`, and Harvest tests.

**Scope:** Anniversary alarm eligibility; six-step composition workflow (gather → candidates → salience → narrative → grammar → store); `harvest_edition` + `harvest_chapter` Brain tables; `document_set_json` storage for **52** render; per-chapter + cover share card pre-render (calls **52** Artifact Layer); `harvest_edition_ready` notification trigger (**21**); mobile paged viewer + archive shelf + explicit share buttons (**51** transport). **Not in 53 build:** Grammar schema/renderer core (**52**); Discovery Card scrub/enum/share bridge (**51**); Time Machine weekly candidate generation (**35**); weekly summary body (**34**); skill evidence extraction (**40** — optional craft input only); push send path (**21**); guard/lexicon tooling.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/36-harvest/` (`00`–`04`) | ✓ docs only |
| `brioela-specs/49-harvest.md` | ✓ spec |
| `_records/connections/32-harvest-connections.md` | ✓ ledger |
| `_records/build-order/33-layer-harvest.md` | ✓ ledger |
| Cross-feature drafts (**52**, **40**, **51**) | ✓ partial stubs |
| `harvest_edition` / `harvest_chapter` tables | ✗ |
| Composition alarm handler | ✗ |
| Mobile Harvest UI | ✗ |
| Harvest tests | ✗ |

**Zero Harvest production code.** `rg 'harvest_edition|harvest_chapter|composeHarvest|HarvestChapter' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared constants (**53**)

| File | Role |
|---|---|
| `shared/constants/harvest/harvest.chapter.type.constant.ts` | `firsts` \| `avoidance_maintained` \| `heritage` \| `discovery` \| `craft` \| `rhythm` \| `family` |
| `shared/constants/harvest/harvest.edition.status.constant.ts` | `generated` \| `opened` (optional lifecycle) |
| `shared/constants/harvest/harvest.attribution.tag.constant.ts` | Distinct install tag for share cards |
| `shared/constants/harvest/index.ts` | Barrel |

### Shared validators (**53**)

| File | Role |
|---|---|
| `shared/validator/harvest/harvest.chapter.candidate.schema.ts` | Pre-rank candidate shape + `sourceQueries` |
| `shared/validator/harvest/harvest.edition.schema.ts` | Edition read response |
| `shared/validator/harvest/harvest.chapter.schema.ts` | Chapter read shape |
| `shared/validator/harvest/harvest.narrative.output.schema.ts` | LLM structured narrative pass output |
| `shared/validator/harvest/harvest.document.set.schema.ts` | `document_set_json` wrapper |
| `shared/validator/harvest/index.ts` | Barrel |
| `shared/routes/harvest.routes.ts` | `HARVEST_ROUTES` |
| `shared/contracts/harvest.contract.ts` | ts-rest get/list/open |

### Brain SQLite schemas (**53**)

| File | Role |
|---|---|
| `_schemas/harvest.edition.schema.ts` | `harvest_edition` |
| `_schemas/harvest.chapter.schema.ts` | `harvest_chapter` |
| `_schemas/index.ts` | Export + migration registration (**04**) |

### Brain policies (**53**)

| File | Role |
|---|---|
| `_policies/harvest/sensitivity.exclusion.policy.ts` | Hard exclusion at candidate layer |
| `_policies/harvest/chapter.copy.policy.ts` | Observations-only, no advice/scoring language |

### Brain helpers (**53**)

| File | Role |
|---|---|
| `_helpers/harvest/compute.anniversary.window.helper.ts` | `period_start` / `period_end` / `year_index` |
| `_helpers/harvest/count.active.weeks.helper.ts` | 10-week eligibility floor |
| `_helpers/harvest/gather.scan.signals.helper.ts` | Scan firsts, counts, staples |
| `_helpers/harvest/gather.recipe.signals.helper.ts` | Cook history, diversity |
| `_helpers/harvest/gather.receipt.signals.helper.ts` | Purchase rhythm |
| `_helpers/harvest/gather.constraint.signals.helper.ts` | Maintained avoidances |
| `_helpers/harvest/gather.heritage.signals.helper.ts` | **49** captures + cook counts |
| `_helpers/harvest/gather.family.signals.helper.ts` | **41**/**49** audience-level moments |
| `_helpers/harvest/load.time.machine.archive.helper.ts` | Year's **35** candidates |
| `_helpers/harvest/build.chapter.candidates.helper.ts` | Step 2 — all types |
| `_helpers/harvest/rank.chapters.by.salience.helper.ts` | Step 3 — spec **38** heuristic |
| `_helpers/harvest/validate.source.queries.helper.ts` | Anti-hallucination gate |
| `_helpers/harvest/build.harvest.narrative.prompt.helper.ts` | Step 4 prompt assembly |
| `_helpers/harvest/build.harvest.grammar.prompt.helper.ts` | Step 5 prompt assembly |
| `_helpers/harvest/pre.render.harvest.share.card.helper.ts` | **52** Artifact → R2 ref |

### Brain handlers (**53**)

| File | Role |
|---|---|
| `_handlers/harvest/check.harvest.eligibility.handler.ts` | Floors before compose |
| `_handlers/harvest/gather.harvest.data.handler.ts` | Step 1 orchestration |
| `_handlers/harvest/build.chapter.candidates.handler.ts` | Step 2 + exclusion policy |
| `_handlers/harvest/rank.harvest.chapters.handler.ts` | Step 3 |
| `_handlers/harvest/write.harvest.narrative.handler.ts` | Step 4 LLM |
| `_handlers/harvest/compose.harvest.grammar.documents.handler.ts` | Step 5 — calls **52** |
| `_handlers/harvest/store.harvest.edition.handler.ts` | Step 6 persist |
| `_handlers/harvest/pre.render.harvest.share.cards.handler.ts` | Step 6 cards |
| `_handlers/harvest/compose.harvest.edition.handler.ts` | Full 6-step alarm entry |
| `_handlers/harvest/trigger.harvest.edition.notification.handler.ts` | **21** `harvest_edition_ready` once |
| `_handlers/harvest/mark.harvest.edition.opened.handler.ts` | `opened_at` write |
| `_handlers/harvest/delete.harvest.edition.handler.ts` | Individual edition delete |
| `_handlers/harvest/load.chapter.candidates.handler.ts` | Wires **40** `craft` type (optional) |

### Brain tools (**53**)

| File | Role |
|---|---|
| `tools/harvest/compose_harvest_edition.tool.ts` | Manual/dev re-compose (admin only) |
| `tools/harvest/list_harvest_editions.tool.ts` | Mira/content inventory read |

### Alarm registration (**53** + **09**/**14**)

| File | Role |
|---|---|
| `_handlers/alarms/handle.harvest.edition.compose.alarm.handler.ts` | `harvest_edition_compose` alarm kind → `composeHarvestEdition` |
| `_helpers/alarms/schedule.harvest.edition.compose.alarm.helper.ts` | Week-before-anniversary schedule |

### API (**53**)

| File | Role |
|---|---|
| `backend/src/api/harvest/_handlers/get.harvest.edition.handler.ts` | `GET` edition + chapters + doc refs |
| `backend/src/api/harvest/_handlers/list.harvest.editions.handler.ts` | Archive shelf |
| `backend/src/api/harvest/_handlers/post.harvest.edition.opened.handler.ts` | Mark opened |
| `backend/src/api/harvest/_handlers/delete.harvest.edition.handler.ts` | User delete |
| `backend/src/api/harvest/_handlers/post.harvest.chapter.share.handler.ts` | Record share + **51** bridge |

### Mobile (**53**)

| File | Role |
|---|---|
| `mobile/features/harvest/screens/harvest.edition.viewer.screen.tsx` | Full-screen paged story (**52** renderer) |
| `mobile/features/harvest/screens/harvest.archive.shelf.screen.tsx` | Past editions list |
| `mobile/features/harvest/components/harvest.chapter.page.tsx` | Single chapter page |
| `mobile/features/harvest/components/harvest.chapter.share.button.tsx` | Explicit share → **51** |
| `mobile/features/harvest/components/harvest.cover.share.button.tsx` | Cover card share |
| `mobile/features/harvest/hooks/use.harvest.edition.ts` | Edition fetch + opened tracking |
| `mobile/network/harvest/harvest.api.ts` | ts-rest client |

### Cross-feature integration (call sites owned by other features)

| File | Role | Owner |
|---|---|---|
| `backend/src/core/generative-grammar/render-harvest-chapter-document.ts` | Artifact PNG export | **52** |
| `backend/src/agents/brain/_handlers/growth-mirror/load.craft.chapter.candidate.handler.ts` | Strongest arc reader | **40** |
| `shared/constants/viral.sharing/discovery.card.type.constant.ts` | `harvest_chapter`, `harvest_cover` | **51** |
| `backend/src/agents/brain/_handlers/notifications/send.push.handler.ts` | `harvest_edition_ready` delivery | **21** |
| `build-guide/18-ambient-intelligence/04-food-time-machine.md` | Candidate archive producer | **35** |

### Tests (**53**)

| File | Role |
|---|---|
| `_helpers/harvest/rank.chapters.by.salience.helper.test.ts` | Salience ordering |
| `_helpers/harvest/validate.source.queries.helper.test.ts` | Untraceable number rejection |
| `_policies/harvest/sensitivity.exclusion.policy.test.ts` | Excluded categories never candidates |
| `_handlers/harvest/check.harvest.eligibility.handler.test.ts` | 10-week + 6-chapter floors |
| `_handlers/harvest/compose.harvest.edition.handler.test.ts` | End-to-end compose abort paths |

---

## Acceptance criteria

### Eligibility and timing

- [ ] Alarm fires week before account anniversary — not calendar Dec 31 (**09**/**14** ambient, no cron).
- [ ] `period_start` / `period_end` span full anniversary year from account `created_at`.
- [ ] &lt;10 active weeks → silent abort; spec **38** milestone moment path unchanged.
- [ ] Duplicate `year_index` for same user → no second edition.

### Composition pipeline

- [ ] Step 1 gather reads spec **38** source table + year's Time Machine archive (**35**).
- [ ] Step 2 produces typed candidates for all seven chapter types where data exists.
- [ ] Hard exclusion policy runs at candidate creation — illness, medical, medication, glucose, guest details, craving history, sub-city location never appear as candidates.
- [ ] Step 3 ranks with spec **38** heuristic; selects 6–10; &lt;6 strong → abort (no edition).
- [ ] Step 4 narrative: one LLM call; every number bound to pre-computed query refs.
- [ ] Step 5 grammar: one LLM call; per-chapter `emotionalTone` / motion differ by type (heritage reverential vs discovery playful).
- [ ] Step 6: `harvest_edition` + `harvest_chapter` rows persisted; `document_set_json` validates against **52** schema.
- [ ] Every shipped chapter has non-empty `source_queries_json` — untraceable chapter blocked.

### Rendering and offline

- [ ] Open renders from stored `document_set_json` — no live 400ms enhancement gate.
- [ ] **52** validation failure → typographic fallback; viewer does not crash.
- [ ] Edition fully viewable offline after generation.

### Share cards

- [ ] One pre-rendered PNG per chapter + cover at compose time.
- [ ] Card content: headline + "my Harvest — Brioela" only.
- [ ] EXIF/metadata stripped on export.
- [ ] Share requires explicit user tap — **51** bridge; never auto-share.
- [ ] Distinct Harvest install attribution tag recorded (**51** **G15**).

### Notification

- [ ] `harvest_edition_ready` sent once per `edition_id` — never re-pushed (**21**).
- [ ] Medium priority; respects quiet hours; queues during active session.
- [ ] Unopened edition available quietly in-app — no nag loop.

### Mobile UX

- [ ] Full-screen paged story with chapter navigation.
- [ ] Archive shelf lists past `year_index` editions; individually deletable.
- [ ] Per-chapter and cover share buttons wired to **51**.

### Optional inputs

- [ ] `craft` chapter omitted when **40** absent or no qualifying trajectory — edition still ships.
- [ ] `heritage` chapter omitted when no **49** captures — edition still ships if other types suffice.
- [ ] Free-user edition real from scan/receipt/avoidance data — no paywall on generation.

### Tier and upsell

- [ ] Harvest generation free for all users (**43**).
- [ ] At most one quiet in-app line about fuller year — never push, never mid-story paywall.

### Boundaries

- [ ] No weekly/monthly mini-recap generation (**49** Out of Scope).
- [ ] No comparative stats vs other users.
- [ ] No goals, scores, or streak mechanics in copy.
- [ ] **52** does not run salience or narrative logic.
- [ ] **51** does not compose chapter headlines.
- [ ] **34** weekly summary unchanged by Harvest compose.

### Privacy

- [ ] Edition data stays on device except user-initiated share cards.
- [ ] Family chapter: audience level only — no Mesa member health detail.
- [ ] Delete edition removes chapters + R2 share refs.

### Metrics

- [ ] Instrument: open rate (7d), completion rate, share rate, attribution installs, 60d retention delta, chapter-type share distribution.

---

## Build order

1. **Schemas + constants** — tables, chapter types, validators.
2. **Gather helpers** — per-source signal readers (can unit test without LLM).
3. **Candidate + salience + exclusion** — floors enforceable without grammar.
4. **Narrative + grammar handlers** — depends **52** compose/validate stubs.
5. **Store + share pre-render** — depends **52** Artifact Layer (**G22**).
6. **Alarm + notification** — depends **09**/**14**/**21**.
7. **API + mobile viewer** — depends stored documents render path.
8. **Share bridge** — depends **51** extension card types (**G2**).

---

## Sources

- `brioela-specs/49-harvest.md`
- `build-guide/36-harvest/`
- `_records/build-order/33-layer-harvest.md`
- Neighbor `_features/35-ambient-intelligence/`, `40-growth-mirror/`, `51-viral-sharing/`, `52-generative-grammar/`, `21-platform-notifications/`, `34-pantry-meal-plan/`
