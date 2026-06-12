# Ground — Build

Feature **27**. Production paths under `backend/src/api/finds/` (handlers, helpers, routes), `tools/ground/` (submit + log-from-scan tools), `shared/drizzle/schema/` (Supabase `find`, `location_signal_summary`), `shared/validator/` (find Zod schemas), `shared/routes/` (find route constants), Brain DO schema for `user_find_history`, and `mobile/features/ground/` (map layer, submission sheets, AI draft card, haptic hook second release).

**Scope:** Find CRUD APIs, AI authenticity gate, face detection pipeline, voice/scan draft helpers, summary aggregation, relevance scoring API, stale/archive maintenance, Ground map Skia signal layer, scan/map entry UX, Brain private history. **Not in 27 build:** Mapbox base setup (**28**), healthy place tables (**28**), product scanner (**24**), menu overlay consumer (**26**), Bela shopper draft batch UI (**42**), push token plumbing (**21**), ambient alarm dispatch (**35**), Mira session DO (**29**/**30**), viral card renderer (**51**).

---

## Shipped today

| Area | Status |
|---|---|
| Brain DO foundation | ✓ (**04** — no `user_find_history` table) |
| `log_memory_event` tool | ✓ (**05** — no `ingredient_not_found` kind yet) |
| Skia Layer 4 map dots spec | ✓ docs only (`01-design-system/05-skia-layers.md`) |
| Notification kinds documented | ✓ (**21** — `ground_moment`, `ground_haptic_discovery`; no producers) |
| `backend/src/api/finds/` | ✗ |
| `tools/ground/` | ✗ |
| Supabase `find` / `location_signal_summary` | ✗ |
| Find Zod schemas | ✗ |
| Mobile Ground feature | ✗ |
| Ground maintenance cron | ✗ |
| Tests | ✗ |

---

## File manifest

### Shared validator (27)

| File | Role |
|---|---|
| `shared/validator/find.schema.ts` | `CreateFindRequestSchema`, `FindSchema`, `FindGateResultSchema`, `FindDraftFromScanSchema`, `LocationSignalSummarySchema`, `FindNearbyQuerySchema`, `ReportFindSchema` |
| `shared/routes/find.routes.ts` | `FIND_ROUTES`, `CREATE_FIND`, `GET_FINDS_NEARBY`, `GET_FINDS_AT_LOCATION`, `REPORT_FIND` |

### Supabase Drizzle (27)

| File | Role |
|---|---|
| `shared/drizzle/schema/find.schema.ts` | `find` table |
| `shared/drizzle/schema/location.signal.summary.schema.ts` | `location_signal_summary` |
| `shared/drizzle/migrations/*` | Postgres migrations + summary update trigger |

Places FK assumes `map_place` or shared places table from **28** — coordinate migration order.

### Brain DO SQLite (27)

| File | Role |
|---|---|
| `backend/src/agents/brain/_schemas/user.find.history.schema.ts` | `user_find_history` private table |
| Brain migration for above | Drizzle migration in brain package |

### Backend API — finds module (27)

| File | Role |
|---|---|
| `backend/src/api/finds/finds.route.ts` | Hono mount |
| `backend/src/api/finds/finds.controller.ts` | Controller wiring |
| `backend/src/api/finds/_handlers/create.find.handler.ts` | `POST /api/finds` — submit + gate |
| `backend/src/api/finds/_handlers/get.finds.nearby.handler.ts` | `GET /api/finds/nearby` — bbox + relevance |
| `backend/src/api/finds/_handlers/get.finds.at.location.handler.ts` | `GET /api/finds/locations/:locationId` — building list |
| `backend/src/api/finds/_handlers/report.find.handler.ts` | `POST /api/finds/:findId/report` |
| `backend/src/api/finds/_handlers/index.ts` | Barrel |
| `backend/src/api/finds/_helpers/run.ai.gate.helper.ts` | Single structured LLM gate |
| `backend/src/api/finds/_helpers/format.find.from.voice.helper.ts` | Transcript → structured Find text |
| `backend/src/api/finds/_helpers/draft.find.from.scan.helper.ts` | Scan context → AI draft (no gate until submit) |
| `backend/src/api/finds/_helpers/detect.faces.r2.helper.ts` | Server-side face detection on R2 URL |
| `backend/src/api/finds/_helpers/strip.video.audio.helper.ts` | Mute video before display URL |
| `backend/src/api/finds/_helpers/update.location.signal.summary.helper.ts` | Increment/decrement aggregates |
| `backend/src/api/finds/_helpers/score.find.relevance.helper.ts` | User profile overlap → relevance_score |
| `backend/src/api/finds/_helpers/check.find.rate.limit.helper.ts` | 10/day + cooldown on gate failures |
| `backend/src/api/finds/_helpers/hash.contributor.helper.ts` | contributor_hash from userId |
| `backend/src/api/finds/_helpers/log.user.find.history.helper.ts` | Brain DO private history write |
| `backend/src/api/finds/_helpers/age.finds.maintenance.helper.ts` | stale/archive transitions |
| `backend/src/api/finds/_helpers/check.ground.entitlement.helper.ts` | Luma gate for Find authoring |
| `backend/src/api/finds/_helpers/index.ts` | Barrel |
| `backend/src/api/finds/index.ts` | Module export |

Register routes in backend app router (**01**).

### Scheduled / queue jobs (27)

| File | Role |
|---|---|
| `backend/src/jobs/ground-age-finds.job.ts` | Daily stale (14d) + archive (60d) — QStash or Supabase cron |
| `backend/src/jobs/ground-summary-reconcile.job.ts` | Optional repair if trigger drift |

### Brain DO tools (27)

| File | Role |
|---|---|
| `tools/ground/submit-find.ts` | Agent/tool path: format + gate + write |
| `tools/ground/log-find-from-scan.ts` | AI-drafted find from scan context |
| `tools/ground/index.ts` | Barrel |
| `tools/index.ts` | Re-export ground tools |

### Mobile (27)

| File | Role |
|---|---|
| `mobile/features/ground/components/ground-map.feature.tsx` | Mapbox + Ground layer toggle |
| `mobile/features/ground/components/ground-signal-layer.tsx` | Skia pulse dots overlay |
| `mobile/features/ground/components/find-list.sheet.tsx` | Building find list bottom sheet |
| `mobile/features/ground/components/find-submission.sheet.tsx` | Voice/type submit flow |
| `mobile/features/ground/components/find-draft.card.tsx` | AI draft below scan: Submit/Edit/Dismiss |
| `mobile/features/ground/components/ambient-contribution.prompt.tsx` | Once-per-visit store prompt |
| `mobile/features/ground/components/gate-rejection.banner.tsx` | Edit/resubmit after gate fail |
| `mobile/features/ground/hooks/use.ground.map.hook.ts` | Fetch nearby summaries + relevance |
| `mobile/features/ground/hooks/use.find.submit.hook.ts` | Submit + gate polling |
| `mobile/features/ground/hooks/use.cached.ground.summaries.hook.ts` | Offline/haptic cache |
| `mobile/features/ground/hooks/use.haptic.discovery.hook.ts` | Second release — walking pulse |
| `mobile/network/finds/create-find.api.ts` | `POST /api/finds` |
| `mobile/network/finds/get-finds-nearby.api.ts` | `GET /api/finds/nearby` |
| `mobile/network/finds/get-finds-at-location.api.ts` | Location find list |
| `mobile/design-system/shaders/ground-pulse.glsl.ts` | SkSL pulse shader constant |

Scanner integration (**24** — not owned by **27**):

| File | Role |
|---|---|
| `mobile/features/scanner/components/scan-follow-up-actions.tsx` | Add Find, Map actions |
| Wire `find-draft.card.tsx` into scan result when place known | Consumer |

### Find-to-cooking (second release — partial owner **35**)

| File | Role | Owner |
|---|---|---|
| `backend/src/api/finds/_helpers/match.find.to.cooking.gap.helper.ts` | ingredient_not_found + Find match | **27** logic |
| `backend/src/jobs/ground-find-cooking-dispatch.job.ts` | Queue ambient card payload | **35** renders |

---

## Acceptance criteria

### First release

- [ ] `find` and `location_signal_summary` tables migrated in Supabase with trigger on find insert/update/delete
- [ ] `user_find_history` in Brain DO with migration
- [ ] `POST /api/finds` runs gate in <1.5s p95; failed finds return structured rejection reason (never silent drop)
- [ ] Face detection blocks media with faces before gate
- [ ] Rate limit: 10 finds/user/day; cooldown after repeated gate failures
- [ ] `GET /api/finds/nearby` returns summaries with `relevance_score` per requesting user
- [ ] `GET /api/finds/locations/:locationId` returns active finds sorted by freshness
- [ ] Map Ground layer: color by signal_type, pulse speed by age, size by relevance
- [ ] AI-drafted Find card appears after green/yellow scan when `location_id` known
- [ ] Voice audio never persisted server-side
- [ ] Contributor hash stored; no contributor identity in any API response
- [ ] Luma entitlement blocks Find *authoring* only — scan verdict unaffected
- [ ] Daily job marks finds stale at 14d, archived at 60d
- [ ] `tools/ground/submit-find.ts` registered in tool registry (**19**)

### Second release

- [ ] Haptic discovery: one pulse within 150m when relevance + freshness rules pass; no push
- [ ] Suppression: cooking session, 20min cooldown, ignored haptics backoff
- [ ] Find-to-cooking: ambient two-action card when Find matches `ingredient_not_found` gap
- [ ] `ingredient_not_found` memory event kind added (**05** + Encore alignment)

### Integration acceptance (cross-feature)

- [ ] **28** map UI shows Ground layer toggle; queries `location_signal_summary` via **27** API
- [ ] **24** scan result "Add Find" opens **27** draft sheet with public facts only
- [ ] **26** menu overlay reads summarized Ground context for `restaurantId` — no raw find rows
- [ ] **42** Bela shopper drafts pass same gate; no order/user identity in find content
- [ ] **21** can deliver `ground_moment` when **27** enqueues medium-priority moment

---

## Build order

From `_records/build-order/07-layer-ground.md`:

1. **04-brain-foundation** (Brain DO)
2. **05-brain-memory-tools** (for `ingredient_not_found` second release)
3. **24-scanner** (find-from-scan entry)
4. **27-ground** (this feature)
5. **28-map** (displays Ground layer on shared base)

---

## Test plan

| Test | Covers |
|---|---|
| `find.schema.test.ts` | Zod round-trip |
| `run.ai.gate.helper.test.ts` | Gate pass/fail shapes (mock LLM) |
| `update.location.signal.summary.helper.test.ts` | Aggregate increments |
| `score.find.relevance.helper.test.ts` | Relevance multiplier bounds |
| `check.find.rate.limit.helper.test.ts` | 10/day + cooldown |
| `create.find.handler.integration.test.ts` | End-to-end submit (mock gate + DB) |
| `age.finds.maintenance.helper.test.ts` | 14d/60d transitions |

---

## Sources

- `build-guide/09-ground/` (00–06)
- `brioela-specs/35-ground-community-intelligence.md`
- `brioela-specs/35b-ground-finds-deep-design.md`
- `_records/build-order/07-layer-ground.md`
- `_records/connections/04-ground-connections.md`
