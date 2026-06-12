# Ambient Intelligence — Build

Feature **35**. Production paths under `backend/src/agents/brain/_schemas/ambient.*.ts`, `travel.*.ts`, `wellbeing.*.ts`, `guest.*.ts`, `time.machine.*.ts`, `backend/src/agents/brain/_handlers/ambient/`, `backend/src/api/travel/`, `shared/validator/ambient/`, `shared/routes/travel.routes.ts`, `mobile/features/ambient/`, Redis travel cache helpers, and QStash worker `backend/src/workers/travel-preload/`. Orchestration hooks into **14** dispatch (`travel_preload`, ambient passes) and **12** `behavior_pattern_detection` chain.

**Scope:** ambient idle checks, candidate queues, wellbeing capture, ambient pattern pass + interventions, travel intent + preload + arrival, time machine builder + inline surfaces, guest session + archive promotion, suppression/audit, find-to-cooking card (second release). **Not in 35 build:** BehaviorPatternAgent DO (**12**), dispatch router (**14**), push send (**21**), map nearby APIs (**28**), Ground submit pipeline (**27**), weekly summary generator body (**34**), wearables corroboration (**36**).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/18-ambient-intelligence/` (7 files) | ✓ docs only |
| `brioela-specs/17`, `22`, `37`, `38`, `23` | ✓ specs |
| `_records/connections/14-ambient-intelligence-connections.md` | ✓ ledger |
| `scheduled_alarms` + alarm tools (**09**) | ✓ — `travel_preload` in tests only |
| `behavior_pattern_detection` SessionKind stub (**12**) | ✓ partial — wrong permissions |
| Ambient Brain tables | ✗ |
| Wellbeing / travel / guest / time machine handlers | ✗ |
| QStash travel preload worker | ✗ |
| Redis travel geo cache writer | ✗ |
| Mobile ambient inline surfaces | ✗ |
| Ambient tests | ✗ |

**Zero ambient production code.** `rg 'wellbeing_signal|travel_intent|guest_session|time_machine|ambient_candidate' backend/src shared/ mobile/` — no matches beyond `travel_preload` alarm string in `alarm.tool.test.ts`.

---

## File manifest

### Shared validator + routes (**35**)

| File | Role |
|---|---|
| `shared/validator/ambient/wellbeing.signal.schema.ts` | Signal capture + read shapes |
| `shared/validator/ambient/behavior.pattern.schema.ts` | Pattern + intervention DTOs |
| `shared/validator/ambient/ambient.candidate.schema.ts` | Candidate queue API |
| `shared/validator/ambient/travel.intent.schema.ts` | Intent detect + status |
| `shared/validator/ambient/travel.preload.schema.ts` | Preload job + package |
| `shared/validator/ambient/time.machine.moment.schema.ts` | Moment queue + surface |
| `shared/validator/ambient/guest.session.schema.ts` | Guest activation + archive |
| `shared/validator/ambient/ambient.suppression.schema.ts` | Family suppression |
| `shared/routes/travel.routes.ts` | `TRAVEL_ROUTES`, status, intent event |

### Brain SQLite schemas (**35**)

| File | Role |
|---|---|
| `_schemas/wellbeing.signal.schema.ts` | `wellbeing_signal` |
| `_schemas/behavior.pattern.schema.ts` | `behavior_pattern` (product table) |
| `_schemas/behavior.pattern.intervention.schema.ts` | `behavior_pattern_intervention` |
| `_schemas/ambient.candidate.schema.ts` | `ambient_candidate` |
| `_schemas/travel.intent.schema.ts` | `travel_intent` |
| `_schemas/travel.preload.job.schema.ts` | `travel_preload_job` |
| `_schemas/travel.local.cache.schema.ts` | `travel_local_cache` (Brain mirror of Redis) |
| `_schemas/time.machine.moment.schema.ts` | `time_machine_moment` |
| `_schemas/guest.session.schema.ts` | `guest_session` |
| `_schemas/ambient.suppression.schema.ts` | `ambient_suppression` |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add ambient tables to Brain chain |

### Ambient intelligence pipeline (**35**)

| File | Role |
|---|---|
| `_handlers/ambient/check.ambient.idle.helper.ts` | 2h idle gate + reschedule |
| `_handlers/ambient/run.ambient.pass.handler.ts` | Dispatcher: patterns / time_machine / guest_review |
| `_handlers/ambient/capture.wellbeing.signal.helper.ts` | Transcript → `wellbeing_signal` |
| `_handlers/ambient/run.ambient.behavior.pattern.pass.handler.ts` | Correlations + intervention candidates (after **12** or merged orchestration) |
| `_handlers/ambient/promote.pattern.interventions.helper.ts` | `pattern.*` + wellbeing → candidates |
| `_handlers/ambient/build.time.machine.candidates.helper.ts` | Weekly 5–10 moments |
| `_handlers/ambient/pick.time.machine.moment.helper.ts` | Surface at scan/recipe/open |
| `_handlers/ambient/review.guest.session.archive.helper.ts` | Weekly promotion to `social.cooking_patterns` |
| `_handlers/ambient/activate.guest.session.helper.ts` | Conversational constraint layer |
| `_handlers/ambient/merge.guest.constraints.helper.ts` | Effective constraint set for scan/recipe |
| `_handlers/ambient/archive.guest.session.helper.ts` | End session → archive |
| `_handlers/ambient/detect.travel.intent.helper.ts` | Voice/calendar/map signals |
| `_handlers/ambient/confirm.travel.intent.helper.ts` | Low-confidence confirm flow |
| `_handlers/ambient/run.travel.preload.handler.ts` | `travel_preload` alarm body (**14** calls) |
| `_handlers/ambient/write.travel.local.cache.helper.ts` | Brain SQLite + Redis geo keys |
| `_handlers/ambient/activate.travel.context.handler.ts` | Arrival: scan priority + map context |
| `_handlers/ambient/deactivate.travel.context.handler.ts` | Return home cleanup |
| `_handlers/ambient/surface.ambient.candidate.helper.ts` | Pick surface + audit log |
| `_handlers/ambient/record.ambient.suppression.helper.ts` | Dismiss → family counters |
| `_handlers/ambient/run.find.to.cooking.trigger.helper.ts` | **Second release** — **27** Find match |

### Brain tools (optional agent-callable)

| File | Role |
|---|---|
| `_tools/activate.guest.mode.tool.ts` | Chat/cooking explicit guest constraints |
| `_tools/get.active.guest.session.tool.ts` | Read layered constraints |
| `_tools/get.travel.status.tool.ts` | Preload complete for agent copy |

### Backend API — travel module (**35**)

| File | Role |
|---|---|
| `backend/src/api/travel/travel.route.ts` | Hono mount `/api/travel` |
| `backend/src/api/travel/travel.controller.ts` | Controller wiring |
| `backend/src/api/travel/_handlers/post.travel.intent.event.handler.ts` | `travel.intent_detected` from worker/client |
| `backend/src/api/travel/_handlers/get.travel.status.handler.ts` | `GET /api/travel/status` |
| `backend/src/api/travel/_handlers/post.travel.preload.worker.handler.ts` | QStash internal callback |
| `backend/src/api/travel/_handlers/index.ts` | Barrel |
| `backend/src/api/travel/index.ts` | Module export |

Register in backend app router (**01**).

### Worker — QStash destination preload (**35**)

| File | Role |
|---|---|
| `backend/src/workers/travel-preload/run.travel.preload.worker.ts` | Fetch community/map/product/menu slices |
| `backend/src/workers/travel-preload/assemble.preload.package.helper.ts` | Build `TravelPreloadPackage` |
| `backend/src/core/clients/upstash.redis.travel.ts` | Geo cache read/write helpers |

### Mobile (**35**)

| File | Role |
|---|---|
| `mobile/features/ambient/components/time.machine.inline.tsx` | Scan/recipe secondary line |
| `mobile/features/ambient/components/travel.ready.banner.tsx` | Arrival / preload complete |
| `mobile/features/ambient/components/guest.constraint.badge.tsx` | Scan verdict guest flag |
| `mobile/features/ambient/components/find.to.cooking.card.tsx` | Second release |
| `mobile/features/ambient/hooks/use.travel.context.ts` | Active destination state |
| `mobile/features/ambient/hooks/use.active.guest.session.ts` | Layered constraints |
| `mobile/network/travel/travel.api.ts` | Status + intent endpoints |

### Tests (**35**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/ambient/check.ambient.idle.helper.test.ts` | Idle reschedule |
| `backend/src/agents/brain/_handlers/ambient/detect.travel.intent.helper.test.ts` | Intent confidence |
| `backend/src/agents/brain/_handlers/ambient/build.time.machine.candidates.helper.test.ts` | Salience ranking |
| `backend/src/agents/brain/_handlers/ambient/merge.guest.constraints.helper.test.ts` | Layer intersection |
| `backend/src/agents/brain/_handlers/ambient/run.travel.preload.handler.test.ts` | Alarm body mock |

---

## Integration points (not owned by **35**)

| Integration | Owner | **35** hook |
|---|---|---|
| `dispatchAlarm` case `travel_preload` | **14** | Calls `run.travel.preload.handler.ts` |
| `spawnBehaviorPattern` on `behavior_pattern_detection` | **12** + **14** | Chain to `run.ambient.behavior.pattern.pass` or post-agent promotion |
| `send-push` / `travel_preload_ready` | **21** | Called from preload complete |
| Map layer on arrival | **28** | Reads Redis cache **35** wrote |
| Menu fit in preload | **26** | Shared intel read |
| Ground community slice in preload | **27** | High-trust notes fetch |
| `weekly_food_summary` handler | **34** | Optional Time Machine line injection |
| Transcript wellbeing events | **29** / **20** | `capture.wellbeing.signal` |
| `ingredient_not_found` memory event | **05** + **27** | Find-to-cooking trigger |

---

## Acceptance criteria

### Ambient alarm loop

- [ ] `checkAmbientIdle` blocks write-heavy passes when session active within 2h; reschedules pass with `scheduled_at = now + 2h`.
- [ ] Ambient failures mark alarm `failed` with `failure_reason`; no user notification.
- [ ] Stale `ambient_candidate` rows expire per `expiresAt`; not surfaced after expiry.
- [ ] No separate cron — all passes use `scheduled_alarms` + **14** wake.

### Behavioral patterns (ambient)

- [ ] Wellbeing signals written only from organic transcript phrases — never from prompted check-ins.
- [ ] Health correlation patterns require ≥5 instances and confidence ≥0.75 before `active`.
- [ ] Max one new pattern intervention surfaced per calendar week per user.
- [ ] Pattern interventions never send push by default.
- [ ] Dismissed pattern twice → family suppressed 14 days; user rejection → `dismissed` status.
- [ ] No medical or mental-health diagnostic copy.
- [ ] **12** `pattern.*` writes still occur on schedule when agent ships — **35** does not duplicate unconstrained LLM pattern detector without orchestration doc in `status.md` G1.

### Pre-trip intelligence

- [ ] High-confidence voice/calendar intent auto-confirms and schedules `travel_preload`.
- [ ] Low-confidence map search asks once before preload.
- [ ] Preload scheduled 48h before departure when departure >48h away.
- [ ] QStash worker writes user-scoped cache; expires 30d after return.
- [ ] On arrival geofence, scan DB priority switches; **28** can load map cache.
- [ ] At most one `travel_preload_ready` push per trip (**21** rules).
- [ ] Preload failure: quiet retry; no user-facing error string.
- [ ] Return home deactivates travel context.

### Food time machine

- [ ] Weekly pass produces 5–10 ranked candidates; 14d expiry.
- [ ] Moments surface inline at scan/recipe/summary — no dedicated timeline screen.
- [ ] No push for Time Machine-only moments.
- [ ] Illness/medical/guest/shame content blocked from moments.
- [ ] No streak/gamification copy.

### Guest mode

- [ ] Guest activation conversational — no settings screen.
- [ ] Permanent user constraints unchanged; guest layer merges for active session.
- [ ] Scan shows dual verdict when guest constraint conflicts.
- [ ] Session archives after end or 24h idle; no guest names stored.
- [ ] Promotion to `social.cooking_patterns` only after 4+ overlapping archived sessions (AI may still decline).

### Surfacing and privacy

- [ ] Ambient suppression: 2 dismissals → 14d; 3 → permanent per family.
- [ ] Surfacing audit row for each shown candidate.
- [ ] No ad targeting; no Ground writes from guest/Time Machine.

### Find-to-cooking (second release)

- [ ] Card only when high-confidence Find + `ingredient_not_found` match.
- [ ] Rare; suppressible; not marketing blast.

### Tests

- [ ] Unit tests for idle gate, travel intent confidence, guest merge, time machine salience.
- [ ] Integration test: schedule `travel_preload` → handler writes cache → status API returns complete.

---

## Cross-feature drafts (do not duplicate)

| Feature | Draft / owner |
|---|---|
| **12** | `_features/12-brain-sub-agents/draft/behavior.pattern.agent.gap.md` |
| **14** | `_features/14-brain-alarm-dispatch/draft/run.inline.alarm.session.handler.gap.md`, `dispatch.alarm.handler.gap.md` |
| **21** | `_features/21-platform-notifications/draft/` — send-push, suppression |
| **27** | `_features/27-ground/draft/match.find.to.cooking.gap.md` |
| **28** | `_features/28-map/` — map display consumer |
| **34** | `_features/34-pantry-meal-plan/draft/handle.weekly.food.summary.handler.gap.md` |

---

## Obsolete ledgers / conflicts (resolve during build)

| Item | Issue | Resolution |
|---|---|---|
| `10-scheduled-alarms.md` | `behavior_pattern_detection` "typically weekly" | Alarm cadence **3 days** per **15**; weekly = intervention budget |
| Spec **17** dedicated tables vs **15** `pattern.*` | Two storage models | **35** tables for wellbeing/interventions; **12** keeps `pattern.*` |
| `build-guide/05-brain/04-sub-agents.md` | Pattern agent skips active-session check | **Prefer 15** — enforce check |
| Ambient idle 2h vs defer 1h | Different constants | Unify in `check.ambient.idle` + **12** spawn (**G22**) |
| `weekly_food_summary` owner | Time Machine line vs summary body | **34** generates; **35** injects at most one history line |
| Session log **019** | Marks specs `[x]` — implementation still open | Docs complete; **35** `status.md` stays `open` |
