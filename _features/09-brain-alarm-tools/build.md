# Brain Alarm Tools — Build

Feature **09**. Production paths under `backend/src/agents/brain/`.

---

## Shipped today

| Area | Status |
|---|---|
| `_schemas/scheduled.alarm.schema.ts` | ✓ (04 DDL; 09 owns tool semantics) |
| Drizzle migration `0007` (`triggering_session_id`) | ✓ |
| `read.user.alarm.repository.ts` + `write.user.alarm.repository.ts` | ✓ |
| `schedule_user_alarm` + `cancel_user_alarm` split tools (2 × 4 files) | ✓ |
| `get.brain.tools.ts` alarm entries + conditional `wake` registration | ✓ |
| `alarm.tool.test.ts` (5 tests) | ✓ |
| `AlarmWakeCallbacks` wired in `BrioelaBrain` | ✗ |
| Live session handler passes `wake` | ✗ |
| Alarm dispatch on DO wake | ✗ (**14**) |

---

## File manifest

### Schema (04 owns DDL; 09 owns tool semantics)

| File | Role |
|---|---|
| `_schemas/scheduled.alarm.schema.ts` | `scheduled_alarms` table + CHECKs + three indexes |
| `drizzle/0000_rapid_rachel_grey.sql` | Initial `scheduled_alarms` CREATE (**04**) |
| `drizzle/0007_scheduled_alarms_triggering_session_id.sql` | Add `triggering_session_id` + partial index |

### Repositories

| File | Functions |
|---|---|
| `_repositories/read.user.alarm.repository.ts` | `readUserAlarm`, `readPendingUserAlarmByType`, `readEarliestPendingScheduledAt` |
| `_repositories/write.user.alarm.repository.ts` | `writeUserAlarm`, `cancelUserAlarm` |

Exported from `_repositories/index.ts` (shipped).

### Tools — split layout (2 × 4 = 8 files)

| Tool | `.tool.ts` | `_schemas/` | `_prompts/` | `_executables/` |
|---|---|---|---|---|
| `schedule_user_alarm` | `schedule.user.alarm.tool.ts` | `schedule.user.alarm.schema.ts` | `schedule.user.alarm.prompt.ts` | `schedule.user.alarm.executable.ts` |
| `cancel_user_alarm` | `cancel.user.alarm.tool.ts` | `cancel.user.alarm.schema.ts` | `cancel.user.alarm.prompt.ts` | `cancel.user.alarm.executable.ts` |

`AlarmWakeCallbacks` type exported from `schedule.user.alarm.executable.ts`.

### Registration

| File | Change |
|---|---|
| `_tools/get.brain.tools.ts` | Alarm tools in `TOOL_PERMISSIONS` + conditional `all` map |
| `_tools/_schemas/index.ts` | Export alarm schemas |
| `_tools/_executables/index.ts` | Export alarm executables |
| `_tools/_prompts/index.ts` | **Does not** export alarm prompts (direct imports — minor gap G14) |
| `_tools/index.ts` | **Does not** re-export alarm tool factories (minor gap G14) |

---

## Executable contracts

### `scheduleUserAlarmExecutable`

1. Reject `scheduled_at <= now` → `{ error: 'scheduled_at_must_be_future', scheduled_at, now }`.
2. If `alarm_type` ∈ `DEDUP_USER_ALARM_TYPES` and pending row exists → `{ error: 'alarm_already_pending', ... }`.
3. `writeUserAlarm` with status `pending`, stringified payload, optional `triggeringSessionId`.
4. `readEarliestPendingScheduledAt` → `await wake.scheduleAlarm(next.scheduledAt)` if any pending.
5. Return `{ id, alarm_type, scheduled_at, status: 'pending' }`.

### `cancelUserAlarmExecutable`

1. `readUserAlarm(id)` — missing → `{ error: 'alarm_not_found', id }`.
2. Status ≠ `pending` → `{ error: 'alarm_not_cancellable', id, current_status, hint }`.
3. Record whether cancelled row was earliest pending (`was_next_alarm`).
4. `cancelUserAlarm` — set `cancelled`, `cancelled_at`, `cancel_reason`.
5. Re-read earliest pending → `scheduleAlarm(next)` or `cancelAlarm()`.
6. Return `{ id, alarm_type, status: 'cancelled', was_next_alarm, new_next_alarm_at }`.

---

## Wake callback wiring (not shipped — G1)

`BrioelaBrain` must implement and pass:

```typescript
const wake: AlarmWakeCallbacks = {
  scheduleAlarm: async (scheduledAtMs) => { /* Agents SDK schedule or ctx.storage.setAlarm */ },
  cancelAlarm: async () => { /* clear DO alarm slot */ },
}

getBrainTools(db, userId, kind, sessionId, waitUntil, wake)
```

Implementation choice (SDK `schedule()` vs raw `setAlarm`) belongs to **09** wake wiring + **14** dispatch — must agree on MIN-pending vs per-row SDK ids (see G6 in `status.md`).

Until wired, `getBrainTools` returns no alarm tools even for permitted session kinds.

---

## Permission matrix (intended — matches shipped)

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern_detection |
|---|---|---|---|---|---|
| `schedule_user_alarm` | ✓ | ✓ | ✗ | ✓ | ✓ |
| `cancel_user_alarm` | ✓ | ✓ | ✗ | ✗ | ✗ |

Both require `wake` parameter at registration time.

---

## Tests (shipped)

| File | Cases |
|---|---|
| `_tools/alarm.tool.test.ts` | Session kind exposure with/without alarm kind; schedule inserts + `scheduleAlarm`; dedup `brain_maintenance_run`; cancel + `cancelAlarm`; reject double cancel |
| `_tools/alarm.tool.test.schema.helper.ts` | Minimal `scheduled_alarms` DDL for isolated DO tests |

```bash
cd backend && bunx vitest run src/agents/brain/_tools/alarm.tool.test.ts
```

Expected: 5 tests green in `Brain Alarm Tools` describe block (verified 2026-06-12).

---

## Acceptance criteria

1. Both tools exist in split layout with Zod input schemas and prompt strings.
2. `schedule_user_alarm` inserts pending row, dedups maintenance/pattern types, rejects past timestamps, calls `scheduleAlarm` with MIN pending.
3. `cancel_user_alarm` cancels pending rows only, preserves audit fields, reschedules or clears wake slot, returns `was_next_alarm` + `new_next_alarm_at`.
4. `getBrainTools()` permission matrix matches build-guide; alarm tools omitted when `wake` undefined.
5. `alarm.tool.test.ts` passes in Workers vitest pool.
6. `BrioelaBrain` passes live `AlarmWakeCallbacks` into session tool builds (**G1** — not met).
7. Dispatch handler, session watchdog, first-boot seeding tracked in dependent features — remain open in `status.md`.

Do not mark feature `shipped` until **G1** and **G2** are closed (tools callable in live DO sessions).

---

## Draft folder

**15** files in `draft/` — 14 production snapshots + `get.brain.tools.alarm-permissions.md` reference note.

---

## Remaining build work (keeps feature `open`)

1. **G1** — Implement `AlarmWakeCallbacks` on `BrioelaBrain` (MIN-pending wake slot).
2. **G2** — Live session handler passes `wake` into `getBrainTools` (**20**).
3. **G6** — Decide SDK per-row schedule vs MIN-pending callback; align with **14** if using `sdk_schedule_id`.
4. **G7** — Optional: add `label` to schedule tool input (column already exists).
5. **G9** — Reconcile cooking timer spec payload with tool schema (**29**).
6. **G12** — Alarm dispatch handler (**14** — out of 09 scope but blocks end-to-end alarms).

G3–G5, G8, G10–G11, G13–G17 documented in `status.md`; many complete in dependent features.
