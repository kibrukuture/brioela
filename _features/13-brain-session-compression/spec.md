# Brain Session Compression — Spec

Feature **13**. Session **context compression** inside the per-user `BrioelaBrain` Durable Object: turn/token thresholds, `checkCompressionNeeded`, `runCompression` orchestration, `applyCompression` DB writes, four-field compression summary schema, continuation context assembly (summary + last 10 verbatim turns), compression chain semantics, and integration contracts with the live turn loop and watchdog lifecycle.

**Not in this feature:** `SessionContextCompressor` DO class, Haiku handler, compressor system prompt (**12-brain-sub-agents**); generic `openSession` / `closeSession` (**11-brain-sessions-lifecycle**); `buildSystemPrompt` block assembly (**15-brain-system-prompt**); live chat turn loop that **calls** compression check (**20-brain-chat-runtime**); Vectorize re-embed on compress (**17-brain-vectorize**); `load_session_context` / `search_session_history` tools (**16-brain-session-tools**); Mira/Gemini Live compressor (**29-cooking-session** / product backbone **24** — separate runtime).

**Living catalog note:** Compression thresholds, summary shape, and continuation tail length are defined authoritatively in `implementable-specs/17-session-lifecycle.md` today. Product backbone (`brioela-specs/24-technical-architecture-backbone.md`) describes a richer Mira-side compressor (sacred block, proactive 50% trigger, fact extraction) — **not** the Brain implementable path. Document both; **implement 17 for Brain feature 13**.

---

## Purpose

Long chat and cooking sessions accumulate turns in `session_turns` and token counters on `sessions`. Without compression, the model context window fills and the agent cannot continue — but naive truncation loses conversational thread.

Feature **13** defines the **Brain-side** solution:

1. **Detect** when a session exceeds thresholds (before the next user turn).
2. **Summarize** all turns via `SessionContextCompressor` (**12**) into a tight four-field JSON record.
3. **Archive** the old session row (`status: compressed`, summary in `outcome_summary`).
4. **Open** a continuation child session (`parent_session_id` link, counters reset).
5. **Carry forward** summary + last **10** verbatim turns so the agent continues naturally — user should not notice.

Raw turns under the old `session_id` are **never deleted**. Full history is recoverable by walking the compression chain.

---

## Architecture placement

```text
Live turn loop (20)
        │
        ▼
checkCompressionNeeded(sessionId)     ← 13: read turn_count + input_tokens
        │
        ├── false → process user turn in current session
        │
        └── true → runCompression()   ← 13 orchestration
                    │
                    ├── read ALL session_turns ORDER BY turn_number
                    ├── subAgent(SessionContextCompressor)  ← 12
                    │       └── Haiku → CompressionSummary (4 fields)
                    ├── applyCompression()                  ← 13
                    │       ├── old session → compressed + outcome_summary JSON
                    │       ├── cancel old session_watchdog  ← 11 contract
                    │       └── insert continuation session + fresh watchdog
                    └── return { newSessionId, continuationPromptTail, recentTurns }
        │
        ▼
New user turn appended to NEW session (turn_number restarts at 1)
```

Compression chain (read path):

```text
getFullSessionChain(currentSessionId)
  → [oldest compressed … newest active]
  → session_turns WHERE session_id IN (chain) ORDER BY session.started_at, turn_number
```

---

## Problem statement

A 2-hour cooking session can produce 80–150 turns. Each turn lives in `session_turns`. The agent context accumulates turns plus static system prompt blocks (BrioelaIdentity, memory, skills, constraints). At some point the context fills.

**Wrong approach:** truncate old turns — loses what grandma said about spice order 40 minutes ago.

**Correct approach (17):** compress old turns into a structured summary, start a new session, continue with summary + recent verbatim tail. Old turns stay under the old `session_id`. `parent_session_id` links the chain.

Source: `implementable-specs/17-session-lifecycle.md` Part 1.

---

## Why Brioela compression is lighter than generic systems

Most systems compress because they have no external memory. Brioela already extracts durable facts during the session:

- Ingredient mentions → `log_memory_event`
- Techniques → `update_user_skill` / `create_user_skill`
- Preferences → `write_user_memory`
- Constraints → `propose_user_constraint`

By compression time, structured information is already in SQLite. The compression summary is an **anchor for conversational thread**, not exhaustive preservation. Four fields suffice.

Source: `implementable-specs/17-session-lifecycle.md` lines 25–33.

---

## Compression triggers — both thresholds, whichever hits first

Checked **before** processing each new user turn. `alarm` and `background` sessions are **N/A** — short by design.

| `session_type` | Turn threshold (`sessions.turn_count`) | Token threshold (`sessions.input_tokens`) |
|---|---|---|
| `chat` | **40** | **60,000** |
| `cooking` | **80** | **100,000** |
| `alarm` | N/A | N/A |
| `background` | N/A | N/A |

Logic (canonical):

```typescript
const TURN_THRESHOLD  = session.sessionType === 'cooking' ? 80  : 40
const TOKEN_THRESHOLD = session.sessionType === 'cooking' ? 100_000 : 60_000

const compressionNeeded =
  session.turnCount   >= TURN_THRESHOLD ||
  session.inputTokens >= TOKEN_THRESHOLD
```

**Timing rule:** Compression runs **before** the new user turn is processed — not after. The triggering user message is appended to the **new** (post-compression) session, not the old one.

**Counter source:** `turn_count` and `input_tokens` on the `sessions` row — incremented by the turn loop (**20**). Threshold uses **`input_tokens` only** (not output/cache columns).

Sources: `implementable-specs/17-session-lifecycle.md`, `build-guide/05-brain/03-session-lifecycle.md`, `build-guide/05-brain/00-overview.md`, `implementable-specs/13-gaps-and-missing-specs.md` item 7 (closed → 17).

---

## `checkCompressionNeeded`

**Target:** `backend/src/agents/brain/_handlers/compress.session.handler.ts`

**Signature:**

```typescript
checkCompressionNeeded(
  db: BrainDatabase,
  sessionId: string,
): boolean
```

**Steps:**

1. Load `inputTokens`, `turnCount`, `sessionType` for `sessionId`.
2. If session missing or `sessionType` is `alarm` | `background` → `false`.
3. Compare against thresholds (table above).
4. Return `true` if either threshold met.

**Does not** mutate DB. **Does not** spawn compressor.

---

## `runCompression` — orchestration

**Target:** same handler file; called by **20** when `checkCompressionNeeded` is true.

**Signature:**

```typescript
runCompression(
  db: BrainDatabase,
  env: Cloudflare.Env,
  brain: BrioelaBrain,           // for subAgent()
  sessionId: string,
  userId: string,
  wake?: AlarmWakeCallbacks,     // watchdog cancel + reschedule — 11 contract
): Promise<RunCompressionResult>
```

**Steps (in order):**

1. Load full session row — must be `status: 'active'`.
2. Read **all** turns: `session_turns WHERE session_id = ? ORDER BY turn_number ASC`.
3. Compute `last10Turns` = last 10 rows by `turn_number` (may be fewer if session shorter).
4. Spin up **SessionContextCompressor** (**12**):
   - Key: `compressor_${userId}_${sessionId}` (per **17**)
   - Pass `{ sessionId, sessionType, turns }` via `@callable() compressContext`
   - Receive validated `CompressionSummary`
5. Call `applyCompression(oldSessionId, summary, last10Turns, wake)`.
6. Return `{ newSessionId, compressionSummary, recentTurns, continuationContextBlock }`.

**Failure:** If Haiku/parse fails, do **not** mark session compressed. Surface error to turn loop — product may retry or ask user to start fresh (exact UX **20**).

**Build-guide drift:** `03-session-lifecycle.md` inlines `generateObject` inside `runCompression` and uses `env.BRAIN.idFromName` on the Brain binding — **prefer spec 17 + feature 12** separate DO class via `subAgent(SessionContextCompressor, ...)`.

---

## SessionContextCompressor — feature 12 boundary

| **12** owns | **13** owns |
|---|---|
| `SessionContextCompressor` DO class | Threshold constants + `checkCompressionNeeded` |
| `compress.session.context.handler.ts` — Haiku `generateObject` | `compress.session.handler.ts` — orchestration |
| `session.context.compressor.system.prompt.ts` | `applyCompression` — DB transaction |
| Return typed `CompressionSummary` | Continuation context string assembly |
| `compressor: []` tool permission (no tools) | Cancel old watchdog, schedule new (**11** helpers) |
| wrangler binding `SESSION_CONTEXT_COMPRESSOR` | `getFullSessionChain` read helper |

**Architectural facts (17):**

- Ephemeral sub-agent DO — dies when summary returned.
- **No tool forwarding** — Brain passes all turns; compressor pure-reasoning + structured JSON.
- Model: **`claude-haiku-4-5-20251001`** — fast, cheap summarization.
- Key difference from maintenance agents: fixed bounded input, no Brain SQLite reads inside compressor.

Draft snapshots for **12**-owned files live in `_features/12-brain-sub-agents/draft/` (`session.context.compressor.agent.gap.md`, `compress.session.context.handler.gap.md`, `session.context.compressor.system.prompt.gap.md`).

---

## Compression summary — four-field schema

**Target:** `backend/src/agents/brain/_schemas/compression.summary.schema.ts`

```typescript
export const compressionSummarySchema = z.object({
  intent:       z.string().min(1).max(500),
  accomplished: z.string().min(1).max(1000),
  decisions:    z.string().max(500).default(''),
  continuing:   z.string().max(500).default(''),
})
```

| Field | Meaning | Max chars |
|---|---|---|
| `intent` | What is this session trying to accomplish? | 500 |
| `accomplished` | What has happened / been completed / learned? | 1000 |
| `decisions` | Key choices — substitutions, corrections, preferences stated | 500 |
| `continuing` | What remains to be done in this session? | 500 |

**Storage:** `JSON.stringify(summary)` in `sessions.outcome_summary` when `status = 'compressed'`. **No** separate `compression_summary` column — shipped schema uses `outcome_summary` only.

**Example (doro wat mid-cook):** see `implementable-specs/17-session-lifecycle.md` lines 126–134.

**Obsolete schema (reject):** Ledger `brain/07-sub-agents/0003` used `topics`, `decisions[]`, `open_items`, `behavior_signals` arrays — **superseded by 17**.

---

## SessionContextCompressor system prompt

Authoritative text: `implementable-specs/17-session-lifecycle.md` lines 103–124.

Summary of rules:

- User-specific, not generic.
- Capture technique details, exact decisions, what mattered.
- Do not include everything — only what agent needs to continue.
- Field length limits enforced in prompt and Zod.
- Output valid JSON matching schema exactly.

**Target file (12):** `_subagents/session-context-compressor/session.context.compressor.system.prompt.ts`

---

## `applyCompression` — DB writes

**Target:** `compress.session.handler.ts` (or `_handlers/apply.session.compression.handler.ts` if split — prefer single handler file per ledger **0004**).

**Signature:**

```typescript
applyCompression(
  db: BrainDatabase,
  oldSessionId: string,
  summary: CompressionSummary,
  last10Turns: BrainSessionTurn[],
  wake?: AlarmWakeCallbacks,
): Promise<{ newSessionId: string; compressionSummary: CompressionSummary; recentTurns: BrainSessionTurn[] }>
```

**Transaction steps:**

1. **Mark old session compressed:**
   - `status: 'compressed'`
   - `outcomeSummary: JSON.stringify(summary)`
   - `endedAt: now`
   - `endReason: 'compressed'`
   - `updatedAt: now`
2. **Cancel old session's pending `session_watchdog`** — same lookup as `closeSession` (**11**): `alarmType = session_watchdog`, `triggeringSessionId = oldSessionId`, `status = pending` → `cancelUserAlarm`.
3. **Insert continuation session** (copy metadata from old row):
   - `id: newSessionId` (new UUID)
   - `userId`, `sessionType`, `recipeId`, `model` — copied from old
   - `parentSessionId: oldSessionId`
   - `alarmType: null`
   - `status: 'active'`
   - Counters zeroed: `inputTokens`, `outputTokens`, cache tokens, `turnCount`, activity counters
   - `outcomeSummary: null`, `endedAt: null`, `endReason: null`
   - `startedAt: now`
4. **Schedule fresh watchdog** on new session — same `WATCHDOG_DURATION` map as **11** open.
5. Refresh DO wake slot if `wake` provided.

**Build-guide drift:** `03-session-lifecycle.md` sets `sessionType: 'chat'` hardcoded on child row and writes to nonexistent `compressionSummary` column — **prefer 17**: inherit parent `sessionType`, use `outcome_summary`.

**Ledger 0003 drift:** marked old session `completed` with `wasCompressed` flag and `sessionType: 'general'` — **invalid**; use `compressed` status and real session types.

---

## Continuation context — prompt structure

After compression, the agent continues in the new session. System prompt = standard blocks (**15**) **plus** continuation tail (**13** assembles; **15** or **20** injects).

Canonical structure from **17**:

```text
[BrioelaIdentity]                                    ← 10
[user_memory, skills index, constraints, personality]  ← 15
[optional: previous completed session outcome]       ← 15 Block 6 — NOT the compressed parent

[CONTINUATION CONTEXT — session was compressed]
Earlier in this session (summary):
  Intent:       {summary.intent}
  Accomplished: {summary.accomplished}
  Decisions:    {summary.decisions}
  Continuing:   {summary.continuing}

[Last 10 turns verbatim from previous session]
turn 71 [user]: ...
turn 72 [assistant]: ...
...
turn 80 [user]: ...

[Current session continues from here — new turns append below]
```

**UX rule:** Agent does **not** announce compression to the user. Conversation feels uninterrupted.

**BrioelaIdentity:** Not dropped on compression — still first block (**10** spec).

**Helper target:** `formatContinuationContext(summary, last10Turns)` in `_handlers/format.continuation.context.helper.ts` or colocated in compress handler.

**Turn formatting:** Include `turn_number` and `role` prefix. Tool turns (`tool_call`, `tool_result`) included in verbatim tail — they are part of continuity.

---

## Last 10 turns — why 10

Industry pattern (Mem0 cited in **17**): ~5 full exchanges (user + assistant). Enough for what was just said, last response, recent tool calls. Fewer breaks continuity; more defeats compression purpose.

**Selection:** `ORDER BY turn_number DESC LIMIT 10` then re-sort ASC for prompt injection.

**Edge case:** Session with ≤10 total turns at compression trigger — carry all turns verbatim; summary still produced from full transcript.

---

## Turn and session immutability

From `implementable-specs/08-session-turns.md`:

- Turns **never deleted** on compression.
- Turns **never re-parented** to new `session_id`.
- Old session turns stay under old `session_id` permanently.
- New session starts `turn_number` at 1 (**20** / turn counter in `agent_state` or session-scoped counter).

Compression reads all turns for summarization; only the **last 10** are injected into continuation prompt.

---

## Traversing the compression chain

**Target:** `_repositories/read.session.compression.repository.ts` or helper on read session repo.

```typescript
getFullSessionChain(db, sessionId): BrainSession[]
```

Walk `parent_session_id` until null; prepend each hop → `[oldest … newest]`.

Full transcript reconstruction:

```sql
-- pseudocode: turns for all sessions in chain, chronological
session_turns WHERE session_id IN (chain_ids)
ORDER BY (session.started_at), turn_number ASC
```

Used by debugging, export, and optional future "full history" tools — not injected wholesale into live prompt.

Partial index `(parent_session_id) WHERE parent_session_id IS NOT NULL` — shipped in `session.schema.ts`.

---

## Watchdog interaction (11 contract, 13 executes on compress)

When compression triggers mid-session (**17** Part 2 interaction):

1. Old session → `compressed` → its pending `session_watchdog` **cancelled** (same as clean close cancel path).
2. New continuation session → **fresh** watchdog scheduled at open-equivalent durations.

**11** defines schedule/cancel contract; **13** must invoke cancel + schedule during `applyCompression`. **14** dispatches watchdog fires.

Watchdog durations (for new session schedule — **prefer 17**):

| `session_type` | Fire after session start |
|---|---|
| `chat` | 2 hours |
| `cooking` | 8 hours |
| `alarm` | 1 hour |
| `background` | 1 hour |

---

## Integration — feature 20 turn loop

From `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`:

```text
onMessage / chat():
  1. checkCompressionNeeded(sessionId)
  2. if true → runCompression → switch to newSessionId + inject continuation context
  3. call model with system prompt + tools + history
  4. append user turn to session_turns (NEW session if compressed)
  5. update inputTokens + turnCount on session row
  6. stream response
```

**20** owns the loop; **13** owns compression functions called at step 1–2.

Cooking sessions written by Mira (**29**) must honor the same threshold check before each Brain RPC turn or Mira-local turn policy — dual-writer rule from **07-sessions.md**.

---

## Downstream consumers

| Consumer | Behavior on compressed session |
|---|---|
| **16** `load_session_context` | Returns `outcome_summary` JSON for a session id — includes compressed sessions' four-field blob |
| **16** `search_session_history` | FTS on `sessions.outcome_summary` — **completed** sessions only per tool spec; compressed sessions may need explicit product decision (G15) |
| **17** Vectorize | Re-embed `outcome_summary` when session compressed — `implementable-specs/18-vectorize.md` Session Compressed section |
| **15** system prompt | Block 6 loads last **completed** session — continuation block is separate mid-session injection (**13**) |

---

## Mira / product backbone — out of scope but documented

`brioela-specs/24-technical-architecture-backbone.md` § Context Compression describes:

- Tiered memory (cold/warm/hot)
- Sacred block never compressed
- Proactive compressor at 50% context
- Extract-before-compress Mem0 pattern
- Separate **Mira session DO** vs **Brain ambient** compressors

This is **product vision** for live Gemini cooking — **not** the implementable Brain path in **17**. Feature **13** implements **17** only. Reconcile Mira compressor with Brain chain in **29** / **30**.

`brioela-specs/09-per-user-brain.md` mentions `session_archive` cold-tier — not in current Drizzle spine; do not implement from product spec alone.

---

## Session status transitions (compression path)

| From | To | Trigger | Owner |
|---|---|---|---|
| `active` | `compressed` | `applyCompression` | **13** |
| — | `active` (child) | continuation insert | **13** (+ watchdog **11**) |

`end_reason` on old row: `'compressed'`.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **13** (this) | Thresholds, `checkCompressionNeeded`, `runCompression`, `applyCompression`, `compression.summary.schema`, continuation context assembly, chain traversal helpers, watchdog cancel/schedule on compress |
| **12** | `SessionContextCompressor` DO, Haiku handler, system prompt, `subAgent()` spin-up |
| **11** | Generic `openSession` / `closeSession`; watchdog duration constants; cancel pattern reused by **13** |
| **20** | Calls compression check before each user turn; switches active session id; appends turns |
| **15** | Static system prompt blocks; may call **13** helper for continuation suffix |
| **16** | Tools reading compressed `outcome_summary` |
| **17** | Vectorize upsert on compress |
| **29** | Mira cooking session lifecycle + optional separate compressor |

---

## Naming drift and layout conflicts

| Issue | Resolution |
|---|---|
| Ledger **0003** four-field names | **Reject** — use **17** schema |
| `compressionSummary` column in build-guide | **Reject** — use `outcome_summary` |
| `session.handler.ts` monolith vs split handlers | **Prefer** `compress.session.handler.ts` per ledger **0004** |
| `_context/compress.session.context.handler.ts` vs `_subagents/.../compress.session.context.handler.ts` | Build-guide **01** lists both paths — **prefer `_subagents/session-context-compressor/`** for Haiku; **13** orchestration in `_handlers/` |
| Inline Haiku in **03** vs DO in **17** | **Prefer 17** DO via **12** |
| `env.BRAIN.get(compressorId)` in build-guide | Wrong binding — compressor is separate DO class |
| `formatTurnsForCompression` | Implement in **12** handler or shared helper — formats `[ROLE] content` per turn |

---

## Sources

- `implementable-specs/17-session-lifecycle.md` (**PRIMARY**)
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/13-gaps-and-missing-specs.md` (item 7)
- `implementable-specs/00-overview.md` (prefix cache / 40-turn chat note)
- `implementable-specs/18-vectorize.md` (re-embed on compress)
- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/00-overview.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md` (**obsolete**)
- `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/10-brain-agent-identity/spec.md` (identity preserved on compress)
- `brioela-specs/24-technical-architecture-backbone.md` (Mira compressor — non-implementable cross-ref)
- `brioela-specs/09-per-user-brain.md` (session_archive mention)
