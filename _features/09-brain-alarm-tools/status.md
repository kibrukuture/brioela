# Status

open

Two alarm tools, repositories, schema alignment, registry entries, and tests exist in `backend/`. Feature is **not** fully done per full spec — `AlarmWakeCallbacks` are not wired in `BrioelaBrain`, live sessions cannot register alarm tools, and end-to-end alarm firing remains in **14-brain-alarm-dispatch**.

# Shipped in backend (partial)

- [x] `scheduled_alarms` Drizzle schema with CHECKs and indexes (`scheduled.alarm.schema.ts`)
- [x] Migration `0007` — `triggering_session_id` column + partial index
- [x] `readUserAlarm`, `readPendingUserAlarmByType`, `readEarliestPendingScheduledAt`
- [x] `writeUserAlarm`, `cancelUserAlarm`
- [x] `schedule_user_alarm`, `cancel_user_alarm` split tools (8 files)
- [x] `AlarmWakeCallbacks` type + executable wake calls (mocked in tests)
- [x] Alarm tools registered in `getBrainTools()` when `wake` provided
- [x] Permission matrix matches build-guide (schedule in chat/cooking/maintenance/pattern; cancel in chat/cooking only)
- [x] Dedup for `brain_maintenance_run` and `behavior_pattern_detection`
- [x] `alarm.tool.test.ts` — 5 tests passing (`bunx vitest run .../alarm.tool.test.ts`)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | `AlarmWakeCallbacks` not implemented on `BrioelaBrain` | `brioela.brain.agent.ts` has no `scheduleAlarm`/`cancelAlarm`/`alarm()` — ledger `0004` next action still open |
| G2 | Live session handler does not pass `wake` into `getBrainTools` | **20-brain-chat-runtime** — tools omitted when `wake` undefined (`get.brain.tools.ts:69-70`) |
| G3 | No pending-alarm list for session prompt | **15-brain-system-prompt** — agent must read table or future repo helper |
| G4 | First-boot seeding of recurring alarms not implemented | `12-schema-version.md` + `15-brain-maintenance` — direct `writeUserAlarm` at DO init; no code in `BrioelaBrain` |
| G5 | `session_watchdog` schedule/cancel on session open/close not built | `17-session-lifecycle.md` — **11-brain-sessions-lifecycle** |
| G6 | `sdk_schedule_id` never written; wake strategy unresolved | Column in schema; `05-alarm-system.md` shows per-alarm SDK `schedule()`; production uses MIN-pending callbacks only |
| G7 | `label` column exists but schedule tool has no input | `scheduled.alarm.schema.ts:21`; `schedule.user.alarm.schema.ts` has no `label` |
| G8 | `recall_check` listed as alarm type in build-guide but spec says Path B | `05-alarm-system.md` table vs `10-scheduled-alarms.md` "What does NOT belong here" |
| G9 | Cooking timer spec payload mismatch | `cooking-session/06-timers.md` uses `alarm_id`, `cooking_timer` type; tool expects `alarm_type`, `scheduled_at`, cancel by `id` |
| G10 | `behavior_pattern_detection` frequency conflict | `10-scheduled-alarms.md` "weekly"; `05-alarm-system.md` "14 days"; `15-maintenance` + `12-schema-version` "3 days" |
| G11 | Who reschedules maintenance — tool vs direct insert | `11-schedule-user-alarm.md` says maintenance inserts directly in handler; `15-maintenance` has sub-agents call `schedule_user_alarm` |
| G12 | Alarm dispatch handler not built | **14-brain-alarm-dispatch** — ledger `0001` open; no `_handlers/dispatch.alarm.handler.ts` |
| G13 | `brioela-tools/00-index.md` status table stale | Still says alarm tools "backend pending" |
| G14 | Barrel exports omit alarm tools/prompts | `_tools/index.ts`, `_tools/_prompts/index.ts` — direct imports work |
| G15 | Partial pending index not shipped | Spec `10-scheduled-alarms.md` partial `WHERE status='pending'`; Drizzle uses full `(status, scheduled_at)` index |
| G16 | Ledger `0001.alarm-dispatch.md` uses obsolete status `fired` | Schema only has `completed`/`failed`/`cancelled`/`processing`/`pending` |
| G17 | Test coverage gaps | No test for earlier-alarm MIN reschedule when second alarm scheduled; no `behavior_pattern_detection` dedup case; no Zod past-time rejection test |

# 09 vs 14 boundary

| In **09** (this feature) | In **14** (separate) |
|---|---|
| `schedule_user_alarm` / `cancel_user_alarm` tools | `runScheduledAlarm` / `dispatchAlarm` handler |
| SQLite queue writes + cancel audit | `processing` → `completed`/`failed` transitions |
| `readEarliestPendingScheduledAt` + wake slot refresh | Per-type handler switch (`session_watchdog`, maintenance, etc.) |
| `AlarmWakeCallbacks` contract | `BrioelaBrain.alarm()` lifecycle wiring to handler |
| Tool permission matrix | Retry/`attempts`/`failure_reason` enforcement |
| Dedup at schedule time | Spawning `alarm` sessions + sub-agents |

# Blocked by

- 04-brain-foundation (schemas + migrations — shipped for `scheduled_alarms`)

# Blocks

- 14-brain-alarm-dispatch (wake handler consumes queue written by 09 tools)
- 11-brain-sessions-lifecycle (`session_watchdog` uses same table/repos)
- 12-brain-sub-agents (maintenance/pattern reschedule via schedule tool)
- 15-brain-system-prompt (pending alarm context block)
- 19-brain-tool-registry (tools 11–12 in full matrix)
- 20-brain-chat-runtime (passes `wake`, exposes tools live)
- 29-cooking-session (timer → Brain alarm integration per timers spec)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `0001.alarm-dispatch.md` | Status `'fired'` — not a valid `scheduled_alarms.status`; use `completed` |
| `0004.alarm-tools.md` | Marked shipped but "Next Action: Wire wake in BrioelaBrain" still accurate — treat stop state as partial for end-to-end |

# Ambiguous / conflicting sources

1. **Wake mechanism:** `10-scheduled-alarms.md` + tool protocol = MIN-pending + injected callbacks. `05-alarm-system.md` = per-alarm Agents SDK schedule + `sdk_schedule_id`. **Production follows implementable specs.**
2. **`recall_check`:** build-guide alarm table includes it; `10-scheduled-alarms.md` explicitly excludes as Path B event work.
3. **Maintenance reschedule:** tool spec says direct insert in handler; maintenance spec says `schedule_user_alarm` via RPC. **Prefer maintenance spec + build-guide permissions.**
4. **Pattern detection cadence:** 3 days vs 14 days vs weekly — **prefer `15-maintenance` + `12-schema-version` (3 days)** for seeding; handler reschedules at run end.
5. **Cooking timers:** `06-timers.md` predates current tool input shape — needs reconciliation in **29**.

# Sources

- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/brioela-tools/11-schedule-user-alarm.md`
- `implementable-specs/brioela-tools/12-cancel-user-alarm.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/12-schema-version.md`
- `implementable-specs/13-gaps-and-missing-specs.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/cooking-session/06-timers.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/05-alarm-system.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`

# Draft count

**15** files in `draft/` (14 production snapshots + `get.brain.tools.alarm-permissions.md`).
