# Status

in_progress

**Dispatch infrastructure shipped.** Registry, batch processor, lifecycle repos, and `BrioelaBrain.alarm()` are live. Handler stub bodies (session_watchdog, brain_maintenance, behavior_pattern) are placeholders — features 11 and 12 fill them in.

**Living catalog:** Alarm type inventory in `spec.md` is a snapshot — new `alarm_type` strings require a new handler registered in `register.brain.alarm.handlers.ts`; no schema migration, no Brain core changes.

# Shipped in backend

- [x] `scheduled_alarms` Drizzle schema — `scheduled.alarm.schema.ts` (**04** / **09**)
- [x] `readUserAlarm`, `readPendingUserAlarmByType`, `readEarliestPendingScheduledAt` (**09**)
- [x] `writeUserAlarm`, `cancelUserAlarm` (**09**)
- [x] `AlarmWakeCallbacks` type exported (**09**)
- [x] `sessions.alarm_type` column for dispatch-created rows (**04**)
- [x] `_dispatch/alarm.handler.registry.ts` — `AlarmHandlerRegistry` (exact + prefix match)
- [x] `_types/brain.alarm.handler.type.ts` — `AlarmHandler`, `AlarmHandlerContext`, `AlarmHandlerResult`
- [x] `_constants/alarm.dispatch.constant.ts` — `MAX_ALARM_ATTEMPTS = 3`, `STALE_PROCESSING_MS`
- [x] `_repositories/read.due.alarms.repository.ts` — pending due + stuck processing rows
- [x] `_repositories/update.alarm.status.repository.ts` — `markAlarmProcessing`, `markAlarmFinished`
- [x] `_handlers/settle.due.alarms.handler.ts` — batch processor
- [x] `_handlers/register.brain.alarm.handlers.ts` — registry factory (only file that changes when agents are added)
- [x] `_handlers/run.session.watchdog.handler.ts` — stub (**11** fills body)
- [x] `_handlers/run.brain.maintenance.handler.ts` — stub (**12** fills body)
- [x] `_handlers/run.behavior.pattern.handler.ts` — stub (**12** fills body)
- [x] `_handlers/run.unknown.alarm.handler.ts` — marks failed with `unknown_alarm_type:<type>`
- [x] `BrioelaBrain.alarm()` — wired; `this.ctx.storage.setAlarm` / `deleteAlarm` as wake callbacks
- [x] `AlarmWakeCallbacks` on live Brain
- [ ] `session_watchdog` handler body (**11**)
- [ ] `brain_maintenance_run` spawn handler body (**12**)
- [ ] `behavior_pattern_detection` spawn handler body (**12**)
- [ ] `health_insight_run` case + spawn handler (**22**)
- [ ] Inline alarm handlers (sickness, travel, medication, weekly, scan) (**20**, **32**, **35**, **22**)
- [ ] Dispatch tests
- [ ] End-to-end alarm fire integration test

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `dispatch.alarm.handler.ts` | Ledger `06-alarm-system/0001` Status `[ ] Open`; `glob **/dispatch*` backend — zero |
| G2 | No `BrioelaBrain.alarm()` lifecycle | `brioela.brain.agent.ts` — migrations + memory RPC only; no `alarm` method |
| G3 | `AlarmWakeCallbacks` not implemented on Brain | **09** G1; `getBrainTools` never receives `wake` in production |
| G4 | No `settleDueAlarms` batch processor | `rg settleDueAlarms backend` — zero |
| G5 | No `readDuePendingAlarms` repository | Only `readEarliestPendingScheduledAt` exists — no due-row list query |
| G6 | Wake strategy unresolved (MIN `setAlarm` vs per-row SDK + `sdk_schedule_id`) | **09** G6; `05-alarm-system.md` vs `10-scheduled-alarms.md` |
| G7 | No alarm lifecycle update repo (`processing`/`completed`/`failed`) | `write.user.alarm.repository.ts` — insert + cancel only |
| G8 | `recall_check` in build-guide switch + first-boot seed conflicts with Path B spec | `05-alarm-system.md` vs `10-scheduled-alarms.md`; **31** owns event path |
| G9 | `session_watchdog` dispatch handler missing | **11** schedules row; **17** defines fire logic — no `session.watchdog.handler.ts` |
| G10 | Spawn handlers missing — dispatch cases would no-op | **12** G7–G9 — no `spawn.brain.maintenance.handler.ts` |
| G11 | Watchdog payload key drift (`sessionId` vs `session_id`) | `03-session-lifecycle.md` vs `17-session-lifecycle.md` / **11** draft |
| G12 | Stuck `processing` row recovery not specified in code | `10-scheduled-alarms.md` mentions retry on next wake — no staleness query |
| G13 | `MAX_ALARM_ATTEMPTS` not defined in codebase | Spec says handler-enforced — no constant file |
| G14 | `health_insight_run` dispatch case + spawn handler | **22** open; `03-health-insight-agent.md` describes flow |
| G15 | Inline `alarm` session runners missing | No `run.inline.alarm.session.handler.ts`; **20** chat loop not wired |
| G16 | `medication_reminder` handler missing | `02-medication-reminders.md` — Vapi/push on fire |
| G17 | `cooking_timer` Brain case + **09** payload mismatch | **09** G9; Mira owns fire — Brain audit only |
| G18 | `weekly_food_summary` / `scan_followup` handlers missing | `05-alarm-system.md` table only — no production |
| G19 | First-boot `recall_check` seed in build-guide must not ship | `05-alarm-system.md` lines 193–199 — contradicts **10** |
| G20 | Ledger `0001` uses obsolete status `fired` | Valid statuses: `pending\|processing\|completed\|failed\|cancelled` |
| G21 | Behavior pattern cadence docs conflict (3d vs 14d) | **15** + **12-schema-version** = 3d; build-guide = 14d |
| G22 | Maintenance active-session defer 1h vs 2h | **15** = 1h; `04-sub-agents.md` = 2h |
| G23 | `07-sessions.md` lists `recall_check` as session `alarm_type` | Path B recall may still set column on `background` session — not scheduled alarm |
| G24 | No integration test: schedule tool → wake → dispatch → completed | **09** tests stop at `scheduleAlarm` mock |
| G25 | `openSession` / `closeSession` not built — watchdog never scheduled in live DO | **11** G3–G6 |

# 14 vs neighbor boundaries

| In **14** (this feature) | In separate feature |
|---|---|
| `dispatchAlarm` router + `settleDueAlarms` | `schedule_user_alarm` / `cancel_user_alarm` — **09** |
| `BrioelaBrain.alarm()` + wake callback impl | Wake type definition — **09** |
| `session_watchdog` **fire** logic | Watchdog **schedule/cancel** — **11** |
| Calls `spawnBrainMaintenance` / `spawnBehaviorPattern` | Spawn bodies + sub-agent DOs — **12** |
| `health_insight_run` case | HealthInsightAgent — **22** |
| `sickness_followup` / `travel_preload` dispatch shell | Prompts + product logic — **32**, **35** |
| `medication_reminder` dispatch | Vapi/OneSignal — **22**, **21** |
| `cooking_timer` audit case | Mira timer fire — **29** |
| `recall_check` scheduled case | **Do not implement** — **31** Path B |
| Inline LLM turn loop inside `alarm` sessions | Full chat runtime — **20** |

# Blocked by

- 04-brain-foundation (schema — shipped)
- 09-brain-alarm-tools (repos + tools — shipped; wake G1 shared with **14**)
- 11-brain-sessions-lifecycle (watchdog rows — open)
- 12-brain-sub-agents (spawn handlers — open)

# Blocks

- 20-brain-chat-runtime (live `wake` + alarm tools + inline alarm sessions)
- 21-platform-notifications (weekly summary push from dispatch)
- 22-health-intelligence (medication + health_insight dispatch cases)
- 29-cooking-session (timer audit alignment)
- 31-recall-alerts (Path B — separate from **14** queue)
- 32-illness-detective (sickness followup handler body)
- 35-ambient-intelligence (travel preload handler body)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `06-alarm-system/0001.alarm-dispatch.md` | Status `'fired'` — use `completed`; "Sub-agent cases added in sub-agents scope" — still accurate |
| `0001` "marks alarm fired" | Replace with `completed` + `completed_at` |

# Ambiguous / conflicting sources

1. **Batch vs per-row wake:** **10-scheduled-alarms** + shipped **09** = MIN-pending batch. **05-alarm-system** + **07-hardening** = per-row SDK `{ scheduledAlarmId }`. **Production follows 10 + 09 until G6 resolved.**
2. **`recall_check`:** build-guide scheduled table + init seed vs **10** Path B exclusion. **14 does not implement scheduled recall_check.**
3. **Watchdog durations:** **17** (2h/8h) vs **03-session-lifecycle** (2h/4h). **14 handler follows 17.**
4. **Watchdog abandon logic:** **03-session-lifecycle** simple abandon vs **17** inactivity + reschedule. **14 follows 17.**
5. **Pattern detection interval:** 3d (**15**) vs 14d (build-guide). **14 passes through to spawn; reschedule at 3d.**
6. **Cooking timer:** Brain dispatch role undefined until **29** + **09** G9 reconciled.

# Sources

- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/12-schema-version.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/cooking-session/06-timers.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/08-cooking-session/05-timers.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`
- `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `build-guide/30-mira/01-scene-contract.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`
- `_features/09-brain-alarm-tools/spec.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/12-brain-sub-agents/spec.md`

# Draft count

**14** files in `draft/` (intended production snapshots — none exist in backend yet).
