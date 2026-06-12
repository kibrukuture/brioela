# Status

open

**Ambient intelligence not shipped.** Build-guide **18-ambient-intelligence** is complete (docs only). Zero ambient Brain tables, zero wellbeing/travel/guest/time-machine handlers, zero QStash preload worker, zero Redis travel cache writer, zero mobile ambient surfaces. Partial: `scheduled_alarms` + alarm tools (**09**) — `travel_preload` string in tests only; `behavior_pattern_detection` SessionKind stub (**12**) — wrong permissions, no agent DO.

# Shipped in backend (partial / unrelated)

- [x] `scheduled_alarms` + `schedule_user_alarm` / `cancel_user_alarm` (**09**)
- [x] `travel_preload` alarm_type in `alarm.tool.test.ts` examples
- [x] `sessionKindSchema` includes `behavior_pattern_detection` — `get.brain.tools.ts` (drift vs **15**)
- [x] `DEDUP_USER_ALARM_TYPES` includes `behavior_pattern_detection` — not `travel_preload`
- [ ] Ambient Brain SQLite tables (`wellbeing_signal`, `behavior_pattern`, `travel_intent`, `guest_session`, `time_machine_moment`, `ambient_candidate`, …)
- [ ] `_handlers/ambient/` directory
- [ ] Wellbeing signal capture from transcripts
- [ ] Ambient behavior pattern pass + intervention candidates
- [ ] Travel intent detection + `travel_preload` handler body
- [ ] QStash travel preload worker + Redis geo cache
- [ ] Arrival activation / travel context switch
- [ ] Time Machine weekly candidate builder + inline surfaces
- [ ] Guest session + archive + memory promotion
- [ ] Ambient suppression + audit trail
- [ ] `travel_preload_ready` push trigger (**21** consumer unwired)
- [ ] Find-to-cooking ambient card (second release)
- [ ] Mobile `features/ambient/`
- [ ] Ambient tests

# Blocked by

- **04** — Brain migrations spine for new tables
- **09** — alarm schedule (partial ✓)
- **11** — `openSession` / `closeSession` for inline `travel_preload` alarm sessions
- **12** — `BehaviorPatternAgent` + `pattern.*` chain (or explicit orchestration decision **G1**)
- **14** — `dispatchAlarm` + `travel_preload` case + batch wake
- **20** — inline alarm LLM loop shell (shared with sickness followup)
- **21** — `send-push`, suppression tables for `travel_preload_ready`
- **24** — scan events (Time Machine, patterns)
- **29** — cooking transcripts (wellbeing, guest)
- **28** — map display of destination cache (consumer)
- **27** — find-to-cooking (second release)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **35 vs 12 orchestration undefined** | Two pattern systems: **12** `pattern.*` (3+ events, 3d) vs **35** wellbeing/interventions (5+ instances, surfacing). No `run.ambient.behavior.pattern.pass` or post-agent chain in repo |
| G2 | No ambient Brain schemas | `rg wellbeing_signal travel_intent guest_session backend/src/agents` — zero |
| G3 | No `_handlers/ambient/` | Directory missing |
| G4 | No `checkAmbientIdle` helper | `01-ambient-alarm-loop.md` — not implemented |
| G5 | No `ambient_candidate` queue | Build-guide type — no table |
| G6 | No wellbeing signal capture | Spec **17** — no transcript processor |
| G7 | No `behavior_pattern` product table | Spec **17** SQL — only `user_memory` path in **12** |
| G8 | No intervention surfacing helper | Max 1/week cap not enforceable |
| G9 | No travel intent detection | Spec **22** — no `travel_intent` table or event handler |
| G10 | No `run.travel.preload.handler` | **14** spec references; **14** draft inline shell only |
| G11 | No QStash preload worker | Spec **22** `POST /api/travel/preload` — no worker |
| G12 | No Redis travel geo cache writer | **28** consumer documented; **35** producer missing |
| G13 | No arrival activation | Scan DB priority switch — not built |
| G14 | No `GET /api/travel/status` | Spec **22** API — missing |
| G15 | No time machine candidate builder | Spec **38** weekly 5–10 queue — missing |
| G16 | No time machine inline mobile UI | Scan/recipe secondary line — missing |
| G17 | No `guest_session` table | Spec **37** — missing |
| G18 | No guest constraint merge for scan/recipe | Layering helper — missing |
| G19 | No guest archive weekly review | `guest_review` pass — missing |
| G20 | Ambient suppression vs **21** `notification_suppression` merge | Two models in docs — unify at implementation |
| G21 | No surfacing audit trail | `06-surfacing-and-privacy.md` — missing |
| G22 | Idle 2h (ambient) vs 1h defer (**12**/**15**) | Conflicting constants — not unified |
| G23 | `behavior_pattern_detection` cadence conflict | Spec **17**/"weekly" vs **15** 3 days — **prefer 15** for alarm; weekly = insight budget |
| G24 | Dedicated tables vs `pattern.*` only | Spec **17** vs **15** — **35** owns dedicated tables for wellbeing/interventions |
| G25 | Alarm dispatch unwired (**14**) | No `travel_preload` case in production |
| G26 | `travel_preload_ready` push unwired (**21**) | No Brain send-push |
| G27 | Weekly summary Time Machine line vs **34** body | Split ownership — coordinate handlers |
| G28 | Find-to-cooking second release | **27** G + `06-find-to-cooking-trigger.md` — not built |
| G29 | No mobile `features/ambient/` | `rg ambient mobile/features` — zero |
| G30 | No ambient tests | Zero test files |

# 35 vs neighbor boundaries

| In **35** (this feature) | In separate feature |
|---|---|
| Wellbeing capture, intervention candidates, ambient surfacing caps | **12** BehaviorPatternAgent `pattern.*` writes |
| `travel_preload` job body, intent, cache write | **14** dispatch case + inline session shell |
| `travel_preload_ready` trigger payload | **21** send + suppression |
| Redis geo cache **write** | **28** map **read** on arrival |
| Time Machine candidates + inline UI | **34** weekly summary generator body |
| Guest session + promotion | **07** permanent constraints |
| Find-to-cooking **card** surface | **27** Find pipeline |
| Ambient suppression families | **21** platform suppression for push |

# Per sub-area shipped vs open

| Sub-area | Shipped | Open |
|---|---|---|
| **Ambient alarm loop** | `scheduled_alarms` table | Idle check, pass dispatcher, candidate expiry |
| **Behavioral patterns (ambient)** | SessionKind enum entry (**12** drift) | Wellbeing table, product patterns, interventions, surfacing |
| **Pre-trip intel** | Alarm type in tests | Intent, preload handler, QStash, Redis, arrival, API |
| **Time machine** | — | Candidate builder, queue, inline mobile |
| **Guest mode** | — | Session table, merge, archive, promotion |
| **Surfacing/privacy** | — | Suppression, audit, copy guards |
| **Find-to-cooking** | — | Second release trigger + card |

# Sources

- `build-guide/18-ambient-intelligence/` (all files)
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `brioela-specs/22-pre-trip-food-intelligence.md`
- `brioela-specs/37-guest-and-cooking-for-others.md`
- `brioela-specs/38-food-time-machine.md`
- `brioela-specs/23-ambient-notification-strategy.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/10-scheduled-alarms.md`
- `_records/connections/14-ambient-intelligence-connections.md`
- `_records/build-order/16-layer-ambient-intelligence.md`
- `_records/session-log/019-ambient-intelligence-complete.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/21-platform-notifications/spec.md`
- `_features/27-ground/spec.md`
- `_features/28-map/spec.md`
