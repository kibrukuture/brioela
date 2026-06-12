# Status

open

**Sift (illness detective) is docs-complete; production is entirely unshipped.** Build-guide `16-illness-detective/` (6 files) and `brioela-specs/30-food-illness-detective.md` are authoritative. No `run_sift` tool, no `illness_report`/`illness_suspect` Brain schemas, no `community_illness_signal` Postgres schema, no ranking handler, no `handle.sickness.followup`, no mobile `illness.detective` feature. `sickness_followup` appears only in **09** alarm schema + test examples.

**Living catalog:** Food-history sources, high-risk categories, and community elevation rules extend without renumbering.

# Shipped (partial)

## Docs / guides
- [x] `build-guide/16-illness-detective/` — 6 files (session log 016)
- [x] `brioela-specs/30-food-illness-detective.md`
- [x] `_records/connections/12-illness-detective-connections.md`
- [x] `_records/build-order/14-layer-illness-detective.md`

## Alarm scheduling (foundation only)
- [x] `schedule.user.alarm.schema.ts` documents `sickness_followup` as example type
- [x] `alarm.tool.test.ts` can schedule `sickness_followup` row in test DB
- [ ] `handle.sickness.followup.handler.ts` — **32** body absent
- [ ] **14** `dispatchAlarm` case wiring — absent

## Investigation pipeline
- [ ] `run_sift` Brain tool + executable
- [ ] `illness_report` / `illness_suspect` Brain SQLite tables
- [ ] Lookback window helper
- [ ] Food-history context builder (`memory_event` query)
- [ ] Structured LLM ranking handler
- [ ] `illness-detective` system skill seed

## External reads (consumers — blocked on siblings)
- [ ] Active `recall_entry` read for ranking — **31** unshipped
- [ ] `memory_event` food history — **05**/**24**/**33** producers largely unshipped
- [ ] Optional `health_events` read — **22** unshipped

## Community + privacy
- [ ] `community_illness_signal` Supabase schema + migration
- [ ] Anonymized write helper (no user_id)
- [ ] 3+/72h elevation rule
- [ ] Authority export opt-in gate
- [ ] Illness history deletion handler

## Mobile / UX
- [ ] `mobile/features/illness.detective/` result screen
- [ ] Sift entry in chat or dedicated surface
- [ ] Static severe-symptom safety banner
- [ ] Generative empathetic tone integration (**52** — optional)

## Tests
- [ ] Lookback window unit tests
- [ ] Ranking order tests (recall boost)
- [ ] Community write privacy tests
- [ ] Follow-up schedule integration test

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No `run_sift` tool** | `rg run_sift backend/src` — zero |
| G2 | **No illness Brain schemas** | `rg illness_report shared backend` — zero |
| G3 | **No `community_illness_signal` schema** | `rg community_illness shared/drizzle` — zero |
| G4 | **No ranking LLM handler** | No `rank.sift` or `sift/` folder |
| G5 | **No `handle.sickness.followup`** | **14** build.md lists target — file absent |
| G6 | **No mobile Sift feature** | `rg illness.detective mobile` — zero |
| G7 | **`recall_entry` read blocked** | **31** G3 — no recall schema |
| G8 | **Sparse `memory_event` food history** | **24**/**33**/**29** unshipped — window may be empty |
| G9 | **No `illness-detective` skill seed** | `implementable-specs/04-skills.md` — not in Brain init |
| G10 | **14 dispatch + inline session shell unshipped** | **14** G1–G5 — blocks follow-up execution |
| G11 | **20 chat runtime unshipped** | No live surface to invoke `run_sift` |
| G12 | **27 Ground elevation handoff** | **27** G29 — separate consumer unbuilt |
| G13 | **`health_events` cross-ref** | `29-health-intelligence/00-overview.md` — optional; **22** tables absent |
| G14 | **Wearable supporting context** | **36** unshipped; spec 40 early hint not implemented |
| G15 | **`illness-followup` obsolete name** | `06-backend-do-agent-patterns.md` L96 — conflicts with `sickness_followup` |
| G16 | **Follow-up timing drift** | 24h (build-guide) vs 4–24h (`10-scheduled-alarms.md`) — pick at implementation |
| G17 | **Illness tables missing from `06-brain-memory/01`** | Spec 30 tables not in canonical schema doc yet |
| G18 | **action_outcome key `illness_detective`** | `06-brain-memory/01` L760 — align to `sickness_followup` |
| G19 | **Community vs health tables boundary** | **22** 8-table opt-in ≠ `community_illness_signal` — document at write time |
| G20 | **Visual intake → Sift** | `34-universal-visual-intake.md` — stool photo path not wired |
| G21 | **Session log 016 implies complete** | Build-guide only — no production followed |
| G22 | **Monorepo manifest paths** | `02-coding-standards/01` lists `illness.detective/` — folder absent |

# 32 vs neighbor boundaries

| In **32** (this feature) | In separate feature |
|---|---|
| Sift UX + `run_sift` pipeline | `recall_entry` ingest + recall push (**31**) |
| `illness_report` / `illness_suspect` | `health_events` CRUD + HealthInsightAgent (**22**) |
| `community_illness_signal` writes | Community health 8 tables (**22**) |
| `handle.sickness.followup` prompt/body | `dispatchAlarm` + `runInlineAlarmSession` (**14**) |
| `schedule_user_alarm` call for follow-up | Alarm tool implementation (**09**) |
| Optional follow-up push trigger | Push delivery (**21**) |
| Anonymized illness clustering | Ground map + Find gate (**27**) |
| Acute food illness ranking | Chronic conditions (**23**) |
| Supporting wearable read in rank | Wearable SDK ingest (**36**) |
| `memory_event` food window read | Scan/receipt/recipe writers (**24**, **33**, **25**, **29**) |

# Blocked by

- **04-brain-foundation** — Brain migrations for illness tables
- **05-brain-memory-tools** — `memory_event` writes (`sickness_logged`, food events)
- **09-brain-alarm-tools** — schedule follow-up (partial: schema + tests only)
- **14-brain-alarm-dispatch** — `sickness_followup` dispatch shell
- **20-brain-chat-runtime** — primary invocation surface
- **31-recall-alerts** — active recall read for highest-weight ranking
- **24-scanner** / **33-receipt-intelligence** / **29-cooking-session** — food history density (MVP may run on sparse history)

# Blocks

- **27-ground** — elevated illness alert display (consumer of `community_illness_signal`)
- **17-behavioral-food-pattern-detection** — `post_sickness_association` reads illness outcomes (soft)

# Sources

- `build-guide/16-illness-detective/` (all 6 files)
- `brioela-specs/30-food-illness-detective.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/04-skills.md`
- `implementable-specs/10-scheduled-alarms.md`
- `_features/31-recall-alerts/spec.md`
- `_features/22-health-intelligence/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_records/session-log/016-illness-detective-complete.md`
