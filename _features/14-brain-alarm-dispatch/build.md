# Brain Alarm Dispatch — Build

Feature **14**. Production paths under `backend/src/agents/brain/`. Wires DO wake lifecycle to `scheduled_alarms` dispatch, per-type handlers, and post-batch wake-slot refresh.

**Scope:** dispatch router, batch/single wake entry, `session_watchdog` handler, `BrioelaBrain.alarm()` + `AlarmWakeCallbacks` implementation, alarm lifecycle repositories, inline alarm-session orchestrators (thin — feature handlers own prompts), and tests. Spawn handler **bodies** for maintenance/pattern/health remain in **12** / **22** — **14** only calls them from the switch.

**Living surface:** `default` case + unknown `alarm_type` logging — new product alarms add a case + draft note here without renumbering the feature.

---

## Shipped today

| Area | Status |
|---|---|
| `scheduled_alarms` schema + **09** repos (`readUserAlarm`, `writeUserAlarm`, `cancelUserAlarm`, `readEarliestPendingScheduledAt`) | ✓ |
| `AlarmWakeCallbacks` type | ✓ (**09** — type only) |
| `BrioelaBrain.alarm()` / `processDueAlarms` | ✗ |
| `AlarmWakeCallbacks` implemented on `BrioelaBrain` | ✗ |
| `_handlers/dispatch.alarm.handler.ts` | ✗ |
| `_handlers/session.watchdog.handler.ts` | ✗ |
| Due-alarm read + lifecycle update repos | ✗ |
| Spawn handler integration (maintenance/pattern) | ✗ (**12** handlers missing) |
| Inline alarm handlers (sickness, travel, medication, etc.) | ✗ |
| `health_insight_run` dispatch case | ✗ (**22**) |
| `cooking_timer` Brain no-op case | ✗ |
| Dispatch / watchdog tests | ✗ |
| wrangler alarm / Agents SDK schedule binding on Brain | ✗ |

**No dispatch production code exists.** `brioela.brain.agent.ts` has migrations + memory RPC only.

---

## File manifest

### Core dispatch (14)

| File | Role |
|---|---|
| `_handlers/dispatch.alarm.handler.ts` | `dispatchAlarm` — `switch (alarm.alarmType)` router |
| `_handlers/process.due.alarms.handler.ts` | Batch: read due rows, lifecycle, dispatch each, refresh wake |
| `_handlers/run.scheduled.alarm.handler.ts` | Optional per-row SDK entry `{ scheduledAlarmId }` |
| `_handlers/session.watchdog.handler.ts` | `handleSessionWatchdog` — abandon or reschedule |
| `_helpers/build.abandoned.summary.helper.ts` | `buildAbandonedSummary(session, lastTurn)` per **17** |
| `_helpers/parse.alarm.payload.helper.ts` | Typed payload parsers; `session_id` / legacy `sessionId` |
| `_constants/alarm.dispatch.constants.ts` | `MAX_ALARM_ATTEMPTS`, `STALE_PROCESSING_MS`, inactivity thresholds |
| `_repositories/read.due.pending.alarms.repository.ts` | `readDuePendingAlarms`, `readStaleProcessingAlarms` |
| `_repositories/update.scheduled.alarm.lifecycle.repository.ts` | `markAlarmProcessing`, `markAlarmCompleted`, `markAlarmFailed`, `markAlarmRetryPending` |
| `_helpers/alarm.wake.callbacks.helper.ts` | `createAlarmWakeCallbacks(brain)` — `setAlarm` or SDK `schedule` |

### Inline / feature-specific handlers (14 orchestrates; features own prompts)

| File | Role | Feature owner |
|---|---|---|
| `_handlers/run.inline.alarm.session.handler.ts` | Open `alarm` session → LLM loop → close | **14** shell; prompts **32**/**35**/**24** |
| `_handlers/handle.sickness.followup.handler.ts` | `sickness_followup` case | **32** |
| `_handlers/handle.travel.preload.handler.ts` | `travel_preload` case | **35** |
| `_handlers/handle.medication.reminder.handler.ts` | Call/push + outcome columns | **22** |
| `_handlers/handle.weekly.food.summary.handler.ts` | Summary + push | **21** / **35** |
| `_handlers/handle.scan.followup.handler.ts` | Inline or Mira handoff | **24** |
| `_handlers/handle.cooking.timer.audit.handler.ts` | No-op / audit sync for mirror rows | **29** |

### Spawn integration (called from dispatch — bodies in 12/22)

| File | Role | Owner |
|---|---|---|
| `_handlers/spawn.brain.maintenance.handler.ts` | Maintenance spawn | **12** |
| `_handlers/spawn.behavior.pattern.handler.ts` | Pattern spawn | **12** |
| `_handlers/spawn.health.insight.handler.ts` | Health insight spawn | **22** |

### Brain DO wiring

| File | Change |
|---|---|
| `brioela.brain.agent.ts` | `alarm()` lifecycle; `runScheduledAlarm` SDK method; `createAlarmWakeCallbacks`; call `initializeBrainSubAgentAlarms` after init (**12**); pass `wake` to `getBrainTools` |
| `_repositories/index.ts` | Export new alarm lifecycle + due-alarm readers |

### Tests

| File | Role |
|---|---|
| `_handlers/dispatch.alarm.handler.test.ts` | Switch routes to correct handler mocks |
| `_handlers/process.due.alarms.handler.test.ts` | Batch lifecycle, wake refresh, idempotency |
| `_handlers/session.watchdog.handler.test.ts` | Abandon vs reschedule; inactive vs active-long |
| `_helpers/alarm.wake.callbacks.helper.test.ts` | MIN-pending slot updates |

---

## Handler contracts

### `processDueAlarms(database, brain, userId, wake)`

1. `due = readDuePendingAlarms(database, userId, now)` — `pending AND scheduled_at <= now`, ORDER BY `scheduled_at`.
2. `stale = readStaleProcessingAlarms(database, userId, now - STALE_PROCESSING_MS)` — reclaim stuck rows.
3. For each alarm in `[...due, ...stale]`:
   a. `markAlarmProcessing` — conditional on `pending` (or `processing` for stale reclaim).
   b. `try { await dispatchAlarm(database, brain, alarm, wake) } catch`.
   c. On success → `markAlarmCompleted`.
   d. On failure → if `attempts >= MAX_ALARM_ATTEMPTS` → `markAlarmFailed`; else `markAlarmRetryPending` (status back to `pending`, scheduled_at bumped optional).
4. `readEarliestPendingScheduledAt` → `wake.scheduleAlarm` | `wake.cancelAlarm`.

### `dispatchAlarm(database, brain, alarm, wake)`

Parse `payload` JSON object. `switch (alarm.alarmType)` per `spec.md` inventory. Pass `wake` to handlers that reschedule (watchdog, spawn defer paths).

### `handleSessionWatchdog(database, alarm, wake)`

Full logic in `spec.md` § `session_watchdog`. Uses `session_turns` for last activity. Reschedule uses `writeUserAlarm` + wake refresh.

### `createAlarmWakeCallbacks(brain)`

```typescript
{
  scheduleAlarm: async (scheduledAtMs) => {
    await brain.ctx.storage.setAlarm(scheduledAtMs)
    // OR Agents SDK equivalent — must match 09 tool expectations
  },
  cancelAlarm: async () => {
    await brain.ctx.storage.deleteAlarm()
  },
}
```

Document chosen mechanism in code comment; **09** G6 tracks SDK vs raw decision.

---

## wrangler / Agents SDK

| Binding | Purpose |
|---|---|
| `BrioelaBrain` DO class | `alarm()` handler registration |
| Optional: Agents SDK `schedule()` on Brain | Per-row callbacks if product adopts G6 resolution |

No new DO bindings for **14** itself. Sub-agent bindings are **12** / **22**.

---

## Acceptance criteria

1. `BrioelaBrain` implements `alarm()` calling `processDueAlarms` after readiness check.
2. `AlarmWakeCallbacks` wired; **09** tools receive `wake` in live sessions (**20** passes it).
3. Due pending rows transition `pending` → `processing` → `completed` on success.
4. Failed dispatch increments `attempts`; after `MAX_ALARM_ATTEMPTS` → `failed` + `failure_reason`.
5. Stuck `processing` rows reclaimed after `STALE_PROCESSING_MS`.
6. Post-batch wake slot = `MIN(pending scheduled_at)` or cleared when queue empty.
7. `session_watchdog` abandons inactive `active` sessions per **17** thresholds; reschedules +1h when still live.
8. `brain_maintenance_run` case calls `spawnBrainMaintenance` (**12** — may be gap stub until **12** ships).
9. `behavior_pattern_detection` case calls `spawnBehaviorPattern` (**12**).
10. `default` case logs unknown type; marks `failed` with reason.
11. `recall_check` **not** implemented as scheduled case (Path B — **31**).
12. `cooking_timer` case does not block Mira; completes audit row or no-ops safely.
13. Idempotent: double wake on same row does not double-dispatch (conditional processing update).
14. Unit tests cover watchdog abandon, watchdog reschedule, batch completion, wake refresh, unknown type.
15. `bun run verify` passes after implementation.

**Not required for 14 shipped:** all inline feature handlers (sickness, travel, medication) fully implemented — may ship incrementally with `default`/stub if case logs `not_implemented` and marks `failed`. **session_watchdog** + maintenance/pattern routing + wake wiring are the **14** MVP.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_handlers/dispatch.alarm.handler.test.ts
cd backend && bunx vitest run src/agents/brain/_handlers/process.due.alarms.handler.test.ts
cd backend && bunx vitest run src/agents/brain/_handlers/session.watchdog.handler.test.ts
cd backend && bun run verify
```

---

## 14 vs neighbor boundaries (build)

| In **14** build | In separate feature |
|---|---|
| `dispatch.alarm.handler.ts`, `process.due.alarms.handler.ts` | `schedule.user.alarm.*` — **09** |
| `session.watchdog.handler.ts` | `open.session.handler.ts` watchdog insert — **11** |
| `alarm.wake.callbacks.helper.ts` on Brain | Alarm tool executables — **09** |
| `spawn.*.handler.ts` **calls** from switch | Spawn handler **bodies** — **12**, **22** |
| `initializeBrainSubAgentAlarms` **call site** in Brain init | Init handler file — **12** |
| Inline alarm session **orchestrator** | Illness/travel/scan prompts — **32**, **35**, **24** |
| Medication call/push | Vapi/OneSignal — **22**, **21** |
| `recall_check` | **31** Path B workflow |
