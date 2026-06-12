# Brain Sessions Lifecycle — Spec

Feature **11**. Session **open** and **close** lifecycle inside the per-user `BrioelaBrain` Durable Object: creating and finalizing `sessions` rows, scheduling and cancelling `session_watchdog` alarms, session kind semantics, and the contracts that connect session state to system prompt assembly and downstream features.

**Not in this feature:** full system prompt block assembly (**15-brain-system-prompt**), session compression (**13-brain-session-compression**), watchdog **dispatch** when the alarm fires (**14-brain-alarm-dispatch**), session-facing AI tools (`load_session_context`, `search_session_history` — **16-brain-session-tools**), live chat turn loop (**20-brain-chat-runtime**), Mira cooking DO product runtime (**29-cooking-session**).

---

## Purpose

Every user interaction with Brioela — chat, cooking, autonomous alarm work, background maintenance — is a **session**. Sessions are the envelope; `session_turns` holds transcript content. Without a defined open/close lifecycle:

- Sessions stay `active` forever after crashes (blocks maintenance, poisons context)
- No `outcome_summary` bridges one session to the next
- No watchdog detects abandoned rows
- Token/turn counters never finalize for billing and compression triggers

Feature **11** owns the **Brain-side lifecycle mechanics**: insert session at open, assemble prompt hook at open (via **15**), schedule watchdog, finalize session at close, cancel watchdog, write `outcome_summary`.

---

## Architecture placement

```text
User / Mira / Alarm wake
        │
        ▼
openSession()          ← 11: insert sessions row, schedule session_watchdog
        │
        ├── buildSystemPrompt()   ← 15 (imports BrioelaIdentity from 10)
        │
        ▼
Live turn loop         ← 20: append session_turns, increment counters
        │
        ├── checkCompressionNeeded() → runCompression()   ← 13
        │
        ▼
closeSession()         ← 11: status completed, outcome_summary, cancel watchdog
        │
        ▼
Next openSession()     ← Block 6 reads last completed outcome_summary (15)
```

Watchdog path (abandoned detection):

```text
openSession → writeUserAlarm(type: session_watchdog)
        │
        ▼ (time passes, session still active)
DO alarm / SDK schedule fires          ← 14
        │
        ▼
handleSessionWatchdog()                ← 14 executes; 11 defines schedule/cancel contract
        │
        ▼
sessions.status = 'abandoned'
```

---

## Session kinds — two related enums

The codebase uses two related but **not identical** enums. Both appear in specs and production.

### `sessions.session_type` (SQLite — persistence)

| Value | Meaning |
|---|---|
| `chat` | Regular text/voice conversation |
| `cooking` | Live cooking session (often started by Mira DO; row may be written by Brain or Mira) |
| `alarm` | Brain woke from scheduled alarm; autonomous job, no user present |
| `background` | Maintenance, dedup, behavior pattern, or other non-alarm background pass |

Source: `implementable-specs/07-sessions.md`, shipped `session.schema.ts`.

### `SessionKind` (tool registry — runtime permissions)

| Value | Maps to DB `session_type` | Notes |
|---|---|---|
| `chat` | `chat` | Full conversational tool set |
| `cooking` | `cooking` | Recipe + memory tools |
| `alarm` | `alarm` | Restricted write set |
| `brain_maintenance` | `background` | `alarm_type` often `brain_maintenance_run` on row |
| `behavior_pattern_detection` | `background` | `alarm_type` often `behavior_pattern_detection` |

Source: shipped `get.brain.tools.ts` — `sessionKindSchema`.

**Rule:** `openSession` accepts DB session types (`chat` \| `cooking` \| `alarm` \| `background`). Callers that originate from sub-agent passes translate `SessionKind` → `session_type` before insert. Tool registration uses `SessionKind`; session row uses `session_type`.

---

## Table: `sessions` (schema owned by **04**, lifecycle semantics owned by **11**)

One row per session. Stores metadata, lifecycle, token cost, compression chain, outcome summary. **Does not** store turns — those are in `session_turns`.

### Key columns (lifecycle-relevant)

| Column | Role in **11** |
|---|---|
| `id` | UUID v4 via `createId()` at open |
| `user_id` | Owner — self-describing |
| `session_type` | Drives watchdog duration, compression thresholds, tool permissions |
| `parent_session_id` | Compression chain link — set on continuation session (**13**) |
| `recipe_id` | Optional — cooking sessions only |
| `alarm_type` | Optional — alarm/background sessions (`brain_maintenance_run`, etc.) |
| `status` | `active` → `completed` \| `compressed` \| `abandoned` |
| `outcome_summary` | Agent-written at close; JSON string when status is `compressed` (**13**) |
| `model` | Required at insert — e.g. `claude-sonnet-4-6`, `gemini-live` |
| `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens` | Accumulated per session — compression thresholds read `input_tokens` |
| `turn_count` | Monotonic — compression thresholds read this |
| `skills_created`, `constraints_proposed`, `memory_writes` | Session activity counters — incremented during session (**20**) |
| `started_at` | Set at open |
| `ended_at` | Set at close/compress/abandon |
| `end_reason` | `completed` \| `timeout` \| `user_closed` \| `compressed` \| `error` |

### Status transitions

| From | To | Trigger | Owner |
|---|---|---|---|
| — | `active` | `openSession` insert | **11** |
| `active` | `completed` | `closeSession` clean end | **11** |
| `active` | `compressed` | `runCompression` archives old session | **13** |
| `active` | `abandoned` | `session_watchdog` handler | **14** (detection contract **11**) |

### Indexes (shipped)

- `(user_id, status, started_at)` — user session history
- `(session_type, status, started_at)` — type-filtered lists
- `(parent_session_id)` partial — compression chain
- `(recipe_id)` partial — recipe history
- `(started_at)` — chronological
- `(status)` partial on `active` — fast active-session probe

### FTS5 (shipped migration `0001`)

`sessions_fts` + `sessions_fts_trigram` index `outcome_summary` for **16** `search_session_history`. Triggers keep FTS synced on insert/update/delete. Verified in `run.migrations.handler.test.ts`.

---

## Table: `session_turns` (schema **04**, append semantics **20**)

One row per turn. Roles: `user`, `assistant`, `tool_call`, `tool_result`. Ordered by explicit `turn_number` (not `rowid`). Feature **11** does not append turns — but compression (**13**) reads all turns for a session before archiving.

---

## Session open — `openSession`

**Target:** `backend/src/agents/brain/_handlers/open.session.handler.ts`

**Signature (canonical):**

```typescript
openSession(
  db: BrainDatabase,
  userId: string,
  sessionType: 'chat' | 'cooking' | 'alarm' | 'background',
  options?: {
    model: string
    recipeId?: string | null
    alarmType?: string | null
    parentSessionId?: string | null  // continuation after compression
  },
  wake?: AlarmWakeCallbacks,  // from 09 — required to schedule watchdog + refresh DO slot
): Promise<{ sessionId: string; systemPrompt: string }>
```

### Steps (in order)

1. **Generate** `sessionId = createId()`, `now = readCurrentEpochMs()`.
2. **Insert** `sessions` row:
   - `status: 'active'`
   - `inputTokens: 0`, `turnCount: 0`, counters at 0
   - `startedAt: now`, `endedAt: null`, `endReason: null`, `outcomeSummary: null`
   - `model` from options (required — no default in spec)
   - Optional `recipeId`, `alarmType`, `parentSessionId`
3. **Schedule `session_watchdog`** via `writeUserAlarm` (**09** repos):
   - `alarmType: 'session_watchdog'`
   - `triggeringSessionId: sessionId`
   - `payload: JSON.stringify({ session_id: sessionId })` — **prefer `session_id` key** per `17-session-lifecycle.md`; build-guide uses `sessionId` (see ambiguous sources)
   - `scheduledAt: now + WATCHDOG_DURATION[sessionType]`
   - `status: 'pending'`
4. **Refresh DO wake slot** — `readEarliestPendingScheduledAt` → `wake.scheduleAlarm(next)` if `wake` provided (**09** G1 still open on `BrioelaBrain`).
5. **Build system prompt** — `await buildSystemPrompt(db, sessionType, userId)` (**15** — blocked by **10** identity constant).
6. **Return** `{ sessionId, systemPrompt }`.

### Watchdog durations

**Prefer `implementable-specs/17-session-lifecycle.md`** (most complete):

| `session_type` | Fire after session start |
|---|---|
| `chat` | 2 hours |
| `cooking` | 8 hours |
| `alarm` | 1 hour |
| `background` | 1 hour |

Build-guide `03-session-lifecycle.md` and `05-alarm-system.md` say **2h chat / 4h cooking** only — treat as stale shorthand (see `status.md`).

Rationale (17): legitimate long cooking sessions must not false-trigger; watchdog catches **stuck** `active` rows, not merely long ones. Inactivity check at fire time (17) distinguishes active-long vs abandoned.

### Active session policy

`07-sessions.md`: query `WHERE status = 'active'` should return 0 or 1 per user at a time. `openSession` should either:
- Refuse to open if another `active` session exists (strict), or
- Abandon/close stale active row first (product decision — spec does not mandate which)

`load_session_context` (**16**) and Brain maintenance (**12**) depend on no orphaned `active` rows — watchdog exists to enforce this.

---

## System prompt at open — contract with **15**

Feature **11** calls `buildSystemPrompt` at open; feature **15** implements it. Block order (prefix-cache critical):

```
1. BrioelaIdentity          — 10
2. constraints              — confirmed
3. user_personality         — active, strength DESC
4. user_memory              — namespaces from getRelevantNamespaces(sessionType)
5. skills index             — name + description only
6. previous session         — most recent completed outcome_summary
─────────────────────────────────────────────────────────────
7. conversation turns       — appended per turn; never interleaved above (20)
```

After compression (**13**), continuation prompt adds `[CONTINUATION CONTEXT]` block + last 10 verbatim turns before live turns.

`getRelevantNamespaces(sessionType)` (15):

- `cooking` → `['health', 'cooking', 'life.dietary', 'health.medications']`
- else → `['health', 'life', 'cooking.preferences']`

---

## Session close — `closeSession`

**Target:** `backend/src/agents/brain/_handlers/close.session.handler.ts`

**Signature (canonical — prefer 17):**

```typescript
closeSession(
  db: BrainDatabase,
  sessionId: string,
  endReason: 'completed' | 'user_closed' | 'error',
  outcomeSummary: string,
  wake?: AlarmWakeCallbacks,
): Promise<void>
```

### Steps

1. **Update session:**
   - `status: 'completed'`
   - `outcomeSummary`
   - `endedAt: now`
   - `endReason`
2. **Cancel watchdog:**
   - Find pending row: `alarmType = 'session_watchdog'` AND `triggeringSessionId = sessionId` AND `status = 'pending'`
   - `cancelUserAlarm` with `cancelReason: 'session_closed'`
   - Re-read earliest pending → `wake.scheduleAlarm(next)` or `wake.cancelAlarm()`
3. **FTS sync** — automatic via triggers when `outcome_summary` written.

### `outcome_summary` content

Agent-written short paragraph at session end: what happened, facts extracted, constraints proposed, skills created. Empty alarm sessions get minimal summary. Rich cooking sessions get technique/recipe notes. This becomes Block 6 of the **next** session's system prompt and is searchable via FTS (**16**).

Build-guide simplified version omits `endReason` parameter — **prefer 17**.

---

## Abandoned session detection — `session_watchdog`

### Schedule (11)

Every session open schedules one pending `session_watchdog` row (see open steps above). Uses **09** alarm repositories — same queue as agent-scheduled alarms.

### Dispatch (14 — not 11)

When watchdog fires, handler (**14**) runs logic from `17-session-lifecycle.md`:

1. Load session by `payload.session_id`.
2. If `status !== 'active'` → no-op (clean close already happened).
3. Check **inactivity** since last turn (or `started_at` if no turns):

| `session_type` | Inactivity threshold |
|---|---|
| `chat` | 30 minutes |
| `cooking` | 1 hour |
| `alarm` | 15 minutes |
| `background` | 15 minutes |

4. If inactive ≥ threshold → mark `abandoned`, `endReason: 'timeout'`, brief `outcome_summary`.
5. If still recently active → **reschedule** watchdog +1 hour (17) — do not abandon long-but-live sessions.

Build-guide `03-session-lifecycle.md` uses simpler logic (no inactivity/reschedule) — **prefer 17**.

### Cancel (11)

`closeSession` and compression (**13**) cancel the old session's watchdog. New continuation session gets a fresh watchdog at its open.

---

## Compression — deferred to **13** (spec reference only)

Long sessions hit turn/token thresholds before the next user turn is processed:

| Session type | Turn threshold | Token threshold (`input_tokens`) |
|---|---|---|
| `chat` | 40 | 60,000 |
| `cooking` | 80 | 100,000 |
| `alarm` | N/A | N/A |
| `background` | N/A | N/A |

`SessionContextCompressor` (ephemeral sub-agent, **12**/**13**) produces four-field JSON:

```typescript
{ intent, accomplished, decisions, continuing }  // Zod max lengths per field
```

Old session → `status: 'compressed'`, `outcomeSummary: JSON.stringify(summary)`, `endReason: 'compressed'`. New session → `parentSessionId` link, fresh watchdog, continuation context + last 10 turns.

**11 boundary:** compression **cancels** old watchdog and **opens** continuation session using same `openSession` path — but compressor implementation lives in **13**.

---

## Session activity counters (during session — **20** implements)

During an active session, fire-and-forget increments on the session row:

- `turn_count` — each user/assistant turn
- `skills_created`, `constraints_proposed`, `memory_writes` — on successful tool writes
- Token fields — accumulated at turn end or session end

**11** defines the columns; **20** increments them.

---

## Dual-writer rule — Brain vs Mira

`07-sessions.md`: both `BrioelaBrain` and `MiraSession` write to the same `sessions` table. `session_type` distinguishes them.

| Writer | Typical `session_type` | **11** responsibility |
|---|---|---|
| `BrioelaBrain` | `chat`, `alarm`, `background` | Full open/close/watchdog via handlers |
| `MiraSession` | `cooking` | Product DO writes/updates row; must call Brain for persistent memory; should use same watchdog contract |

**29-cooking-session** owns Mira DO lifecycle, WebSocket, Gemini Live. **11** owns the **schema + Brain-side contract** Mira must honor when writing session rows and calling back with `outcome_summary`.

---

## Feature boundaries (11 vs neighbors)

| Concern | Owner |
|---|---|
| `sessions` / `session_turns` Drizzle schemas + FTS migrations | **04** (shipped) |
| `openSession`, `closeSession`, watchdog schedule/cancel | **11** |
| `buildSystemPrompt`, format helpers, namespace filter | **15** |
| `BrioelaIdentity` constant | **10** |
| Compression thresholds, compressor, child session | **13** (+ **12** sub-agent) |
| `session_watchdog` alarm dispatch, inactivity logic | **14** |
| `load_session_context`, `search_session_history` tools | **16** |
| Turn append, `generateText` loop, `getBrainTools` wiring | **20** |
| Mira DO, timers, Gemini, cooking UX | **29** |
| `schedule_user_alarm` / `cancel_user_alarm` tools + repos | **09** (watchdog rows use same table) |

---

## Naming drift (historical — not guard/lexicon tooling)

- `SessionCallerType` → `SessionKind` (fixed per complaint 006)
- `getToolsForSessionType` → `getBrainTools` (fixed)
- Build guide folder `_schema/` vs shipped `_schemas/`
- Build guide `session.handler.ts` vs ledger split `open.session.handler.ts` + `close.session.handler.ts`
- Payload key `sessionId` (build-guide) vs `session_id` (17) — **prefer snake_case in JSON payload**

---

## Sources

- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/10-scheduled-alarms.md` (watchdog as alarm type)
- `implementable-specs/brioela-tools/16-load-session-context.md` (reads outcomes — **16**)
- `implementable-specs/brioela-tools/17-search-session-history.md` (**16**)
- `implementable-specs/cooking-session/02-mira-session.md` (Mira boundary)
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/00-overview.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0002.system-prompt-builder.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0003.session-close.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md` (obsolete field names — see status)
- `_features/04-brain-foundation/spec.md` (schema ownership)
- `_features/09-brain-alarm-tools/spec.md` (alarm queue + G5 watchdog)
- `_features/10-brain-agent-identity/spec.md` (Block 1)
- `_features/15-brain-system-prompt/status.md`
- `_features/16-brain-session-tools/status.md`
- `_features/20-brain-chat-runtime/status.md`
- `_features/29-cooking-session/` (stub)
