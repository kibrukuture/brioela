# Brain Sessions Lifecycle — Build

Feature **11**. Production paths under `backend/src/agents/brain/`.

---

## Shipped today

| Area | Status |
|---|---|
| `_schemas/session.schema.ts` | ✓ (**04** DDL; **11** owns lifecycle semantics) |
| `_schemas/session.turn.schema.ts` | ✓ (**04** DDL) |
| Drizzle migration `0000` — `sessions` + `session_turns` CREATE | ✓ |
| Drizzle migration `0001` — FTS5 + triggers for sessions + session_turns | ✓ |
| Drizzle migration `0007` — `scheduled_alarms.triggering_session_id` | ✓ (**09** column; **11** watchdog uses it) |
| FTS trigger sync tests in `run.migrations.handler.test.ts` | ✓ |
| `writeUserAlarm` / `cancelUserAlarm` / `readPendingUserAlarmByType` | ✓ (**09**) |
| `open.session.handler.ts` | ✗ |
| `close.session.handler.ts` | ✗ |
| Session read/write repositories | ✗ |
| `buildSystemPrompt` integration at open | ✗ (**15** — handler missing) |
| `session_watchdog` schedule on open | ✗ |
| `session_watchdog` cancel on close | ✗ |
| `BrioelaBrain` session RPC / chat entrypoint | ✗ (**20**) |
| Session lifecycle unit tests | ✗ |
| `AlarmWakeCallbacks` on `BrioelaBrain` | ✗ (**09** G1) |

**Partial foundation only.** Schemas and FTS exist; no handler opens or closes a session in production.

---

## File manifest

### Schemas (04 owns DDL; 11 owns lifecycle write rules)

| File | Role |
|---|---|
| `_schemas/session.schema.ts` | `sessions` table — 4 session types, 4 statuses, token/counter columns |
| `_schemas/session.turn.schema.ts` | `session_turns` — roles, turn_number, tool columns |

### Migrations (04 spine; 11 consumes)

| File | Role |
|---|---|
| `drizzle/0000_rapid_rachel_grey.sql` | CREATE `sessions`, `session_turns` |
| `drizzle/0001_add_fts_and_triggers.sql` | `sessions_fts`, `sessions_fts_trigram`, turn FTS + sync triggers |
| `drizzle/0007_scheduled_alarms_triggering_session_id.sql` | Watchdog cancel lookup by `triggering_session_id` |

### Repositories (to build in 11)

| File | Functions |
|---|---|
| `_repositories/read.user.session.repository.ts` | `readUserSession`, `readActiveUserSession`, `readLastCompletedSession`, `readSessionTurnsOrdered` |
| `_repositories/write.user.session.repository.ts` | `insertUserSession`, `completeUserSession`, `abandonUserSession`, `incrementSessionCounters` |

Export from `_repositories/index.ts` (not shipped).

### Handlers (11 core)

| File | Role |
|---|---|
| `_handlers/open.session.handler.ts` | `openSession` — insert row, schedule watchdog, call `buildSystemPrompt` |
| `_handlers/close.session.handler.ts` | `closeSession` — finalize row, cancel watchdog |
| `_handlers/schedule.session.watchdog.handler.ts` | Optional helper — `WATCHDOG_DURATION` map + `writeUserAlarm` (may inline in open) |

### Schemas — compression summary (13 builds; 11 references)

| File | Role |
|---|---|
| `_schemas/compression.summary.schema.ts` | Zod `CompressionSummarySchema` — **13** |

### Consumers (not built in 11 — verify integration when shipping)

| File | Role |
|---|---|
| `_handlers/build.system.prompt.handler.ts` | Called by `openSession` — **15** |
| `_handlers/compress.session.handler.ts` | Threshold check + compression — **13** |
| `_handlers/dispatch.alarm.handler.ts` | `session_watchdog` case — **14** |
| `brioela.brain.agent.ts` | `@callable()` open/close/chat; `alarm()` wake — **20** + **09** G1 |
| `_tools/load.session.context.tool.ts` | Reads prior outcomes — **16** |

### Registration / kinds

| File | Role |
|---|---|
| `_tools/get.brain.tools.ts` | `SessionKind` vs DB `session_type` — document mapping in draft note |

---

## Handler contracts

### `openSession`

1. Parse/validate `sessionType` ∈ `{ chat, cooking, alarm, background }`.
2. Require `model` string (caller supplies — no silent default).
3. `insertUserSession` with `status: 'active'`, counters zeroed, `startedAt: now`.
4. `writeUserAlarm`:
   - `alarmType: 'session_watchdog'`
   - `triggeringSessionId: sessionId`
   - `payload: JSON.stringify({ session_id: sessionId })`
   - `scheduledAt: now + WATCHDOG_DURATION[sessionType]` (17 durations)
5. If `wake` provided: `readEarliestPendingScheduledAt` → `scheduleAlarm`.
6. `systemPrompt = await buildSystemPrompt(db, sessionType, userId)` (**15**).
7. Return `{ sessionId, systemPrompt }`.

### `closeSession`

1. Load session — missing → throw typed error.
2. `completeUserSession`: `status: 'completed'`, `outcomeSummary`, `endedAt`, `endReason`.
3. Find pending watchdog by `triggeringSessionId`.
4. `cancelUserAlarm` + refresh wake slot via `wake`.
5. Idempotent if already terminal status — return early, do not double-cancel.

### Watchdog schedule constants (implement in 11)

```typescript
const WATCHDOG_DURATION_MS: Record<BrainSession['sessionType'], number> = {
  chat:       2 * 60 * 60 * 1000,
  cooking:    8 * 60 * 60 * 1000,
  alarm:      1 * 60 * 60 * 1000,
  background: 1 * 60 * 60 * 1000,
}
```

Inactivity thresholds and reschedule logic belong in **14** dispatch handler.

---

## SessionKind ↔ session_type mapping (callers)

When opening from sub-agent passes:

| `SessionKind` (tools) | Insert `session_type` | Typical `alarm_type` |
|---|---|---|
| `chat` | `chat` | null |
| `cooking` | `cooking` | null |
| `alarm` | `alarm` | from alarm row |
| `brain_maintenance` | `background` | `brain_maintenance_run` |
| `behavior_pattern_detection` | `background` | `behavior_pattern_detection` |

---

## Acceptance criteria

1. `open.session.handler.ts` exists; inserts valid `sessions` row with required `model`.
2. Open schedules exactly one pending `session_watchdog` with `triggeringSessionId` set.
3. Open calls `buildSystemPrompt` and returns `{ sessionId, systemPrompt }`.
4. `close.session.handler.ts` sets `completed`, writes `outcomeSummary`, `endedAt`, `endReason`.
5. Close cancels pending watchdog for session; wake slot refreshed when `wake` provided.
6. Session repositories exported from `_repositories/index.ts`.
7. Unit tests: open inserts row + alarm row; close completes + cancels alarm; watchdog duration map per type.
8. `bun run verify` passes after add.
9. Compression, dispatch, live chat, session tools remain tracked in **13**, **14**, **16**, **20** — not required to mark **11** shipped.

Do **not** mark **11** `shipped` until open + close handlers exist and watchdog schedule/cancel work end-to-end with **09** repos (wake wiring may remain **09** G1 until **20** passes callbacks).

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_handlers/open.session.handler.test.ts   # when added
cd backend && bunx vitest run src/agents/brain/_handlers/close.session.handler.test.ts  # when added
cd backend && bunx vitest run src/agents/brain/_migrations/run.migrations.handler.test.ts  # FTS — already green
```

---

## Blocked by

- **04-brain-foundation** — schemas + FTS (shipped)
- **09-brain-alarm-tools** — alarm repos + tools (shipped; wake G1 open)
- **10-brain-agent-identity** — Block 1 for prompt at open (not shipped)
- **15-brain-system-prompt** — `buildSystemPrompt` implementation

## Blocks

- **13-brain-session-compression** — needs open/close + parent chain
- **14-brain-alarm-dispatch** — watchdog dispatch (schedule side is 11)
- **16-brain-session-tools** — reads session outcomes
- **20-brain-chat-runtime** — calls open/close around turn loop
- **12-brain-sub-agents** — maintenance opens `background` sessions

---

## Draft folder

See `status.md` for gap list and draft count.

---

## Sources

- `implementable-specs/07-sessions.md`
- `implementable-specs/17-session-lifecycle.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0003.session-close.md`
