# Brain Chat Runtime — Spec

Feature **20**. The **live orchestration layer** that wires session lifecycle, system prompt, compression checks, tool registry, turn persistence, and model/tool loops inside `BrioelaBrain` — plus the **shared turn-loop contract** reused by inline `alarm` sessions (**14**) and referenced by Mira's Brain RPC forwarding (**29**).

**Not in this feature:** `openSession` / `closeSession` handler bodies (**11-brain-sessions-lifecycle**); compression thresholds, `runCompression`, `applyCompression` (**13-brain-session-compression**); `buildSystemPrompt` block assembly (**15-brain-system-prompt**); `getBrainTools` registry matrix (**19-brain-tool-registry**); individual tool executables (**05–18**); alarm **dispatch router** (**14-brain-alarm-dispatch**); sub-agent DO spawn (**12-brain-sub-agents**); MiraSession DO class, Gemini Live bridge, scene builders (**29-cooking-session**, **30-mira-speech-engine**); guard/lexicon/reading-gate tooling.

---

## Purpose

Features **04–19** built schemas, tools, prompts, compression, and registry shells. None of them run a user-facing conversation. **20** is the capstone that:

1. Accepts a user turn (or alarm job context) on `BrioelaBrain`.
2. Ensures an active session exists (via **11**).
3. Checks compression before processing the turn (**13**).
4. Calls the model with static system prompt + history + `getBrainTools` (**15**, **19**).
5. Persists turns and token counters (**08**, **11** repos).
6. Closes sessions with `outcome_summary` and downstream hooks (**11**, **17**).

Without **20**, Brain is a migration shell with memory RPC only (`brioela.brain.agent.ts` today).

---

## Architecture placement

### Brain text chat path (feature 20 primary)

```text
Client / Agents SDK onMessage
        │
        ▼
BrioelaBrain.chat() or handleChatMessage()     ← 20 entry
        │
        ├── ensureActiveSession('chat')        ← 11 openSession (or resume active)
        │     └── buildSystemPrompt()          ← 15 (once per session)
        │
        ▼
FOR EACH user turn:
        │
        ├── checkCompressionNeeded(sessionId)  ← 13
        │     └── if true: runCompression → newSessionId + continuation prefix
        │
        ├── appendSessionTurn(user)            ← 08 / 11 repos
        │
        ├── getBrainTools(db, userId, 'chat', sessionId, waitUntil, wake, env, counter)  ← 19
        │
        ├── streamText / generateText loop     ← AI SDK (maxSteps bounded)
        │     └── tool steps → executables write SQLite
        │
        ├── appendSessionTurn(assistant + tool_call + tool_result rows)
        │
        └── incrementSessionCounters(input/output/cache tokens, turn_count)  ← 11
        │
        ▼
closeSession(outcomeSummary) on explicit end   ← 11
        ├── cancel session_watchdog
        └── embedAndStoreSession (optional)    ← 17 hook at close
```

### Inline alarm session path (shared 20 loop, owned by **14** caller)

```text
BrioelaBrain.alarm() → dispatchAlarm()
        │
        ├── sickness_followup / travel_preload / scan_followup / …
        │
        ▼
runInlineAlarmSession()                        ← 14 shell; 20 loop inside
        │
        ├── openSession('alarm', alarmType)      ← 11
        ├── alarm-specific system prompt         ← feature handler (32, 35, 24)
        ├── bounded generateText (kind: 'alarm') ← 20 pattern
        └── closeSession + action_outcome        ← 11 + 14
```

### Mira live session path (NOT feature 20 — cross-reference)

```text
Mobile → MiraSession DO (session-scoped)
        │
        ├── Gemini 3.1 Flash Live WebSocket     ← 29 / implementable-specs/cooking-session/03-gemini-session.md
        ├── BLOCKING tool_call → executeToolCall
        │     ├── DIRECT: schedule_timer, cancel_timer (Mira-local)
        │     └── FORWARD: write_memory, propose_constraint, view_recipe → Brain RPC
        │
        ├── session_turns written by Mira OR forwarded append RPC   ← dual-writer (**07-sessions.md**)
        ├── compression threshold before each Gemini turn             ← must honor **13** thresholds
        └── session end → Brain finalize_session RPC                ← 29 → 11 close contract
```

**Rule:** **20** owns the **Brain inline** turn loop (`streamText` / `generateText` on Claude). **29** owns **Gemini Live** turn semantics. Both must call the same compression thresholds and respect the same `sessions` / `session_turns` contracts.

---

## Brain vs Mira split

| Concern | BrioelaBrain (**20**) | MiraSession (**29** / **30**) |
|---|---|---|
| Scope | Permanent per-user DO | Ephemeral per live session DO |
| Model | Claude via Vercel AI SDK (`streamText`) | Gemini Live WebSocket (audio/video) |
| Session row writer | Opens/closes `chat`, `alarm`, `background` rows | Opens/updates `cooking` row (and other scene rows) |
| Tool surface | Full `getBrainTools` matrix per `SessionKind` | Gemini `function_declarations` subset + forward to Brain |
| Turn storage | `appendSessionTurn` in Brain handlers | Local transcript + Brain RPC for durable writes |
| System prompt | `buildSystemPrompt` static prefix (**15**) | `buildSystemInstruction(context)` per scene (**29**) |
| Compression caller | Before each user turn in chat loop | Before each user-visible Gemini turn (product rule) |
| Speech policy | N/A (text/voice TBD on Brain path) | MiraSpeechDecisionEngine (**30**) |
| Entry API | `@callable() chat()` / Agents SDK `onMessage` | `/init`, `/stream/*`, `/audio` HTTP/WebSocket |

**Dual-writer concern (**11** G22):** Both DOs write `sessions`. **20** must not assume it is the only writer — `readActiveUserSession` must disambiguate by `session_type` and product guard (0–1 active chat, separate cooking row owned by Mira).

---

## Entry points

### Primary — Brain chat

**Target:** methods on `BrioelaBrain` (`brioela.brain.agent.ts`).

| Surface | Transport | Owner |
|---|---|---|
| `@callable() chat(input)` | Typed Brain RPC / mobile | **20** |
| `onMessage` / Agents SDK chat hook | WebSocket session on Brain DO | **20** |
| `handleChatMessage(message)` | Internal helper | **20** |

**Ledger:** `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md` — Status `[ ] Open`.

**Input contract (target Zod):**

```typescript
export const chatTurnInputSchema = z.object({
  sessionId: z.string().uuid().optional(), // omit → open new chat session
  message: z.string().min(1),
  closeAfterTurn: z.boolean().optional(),  // rare — test/admin
})
```

**Output:** streaming text (SSE/WebSocket) or `{ sessionId, assistantMessage, toolCalls? }` for RPC.

### Secondary — inline alarm loop

**Target:** `runInlineAlarmSession` (**14** draft) calls **20** `runBoundedTurnLoop` with `SessionKind: 'alarm'`.

Not duplicated here — **14** owns dispatch; **20** owns the reusable loop function.

### Out of scope — Mira DO entry

Mira `/init` and Gemini handlers are **29**. **20** documents only the **Brain RPC** surface Mira calls when forwarding tools (`forwardToolToBrain` in `implementable-specs/cooking-session/04-tool-protocol.md`).

---

## Turn loop — authoritative sequence

From ledger **0001.chat-entrypoint.md** + **13** integration + **08** turn rules:

```text
1. Resolve activeSessionId (open or resume)
2. checkCompressionNeeded(activeSessionId)          [13]
3. IF needed:
     runCompression → applyCompression              [13]
     activeSessionId ← newSessionId
     systemPrompt += formatContinuationContext(...)  [13 helper; may attach via 15 contract]
4. Append user turn row (role: user)                [08]
5. Load prior turns ORDER BY turn_number ASC        [11 read repo]
6. Build tools = getBrainTools(..., kind, activeSessionId, waitUntil, wake, env, counter)  [19]
7. streamText / generateText:
     - model: claude-sonnet-4-6 (chat) / haiku or sonnet per alarm handler
     - system: static prefix (+ continuation suffix if compressed)
     - messages: history from session_turns
     - tools
     - maxSteps: 15 (build-guide/05-brain/02-tool-protocol.md)
     - onStepFinish: append tool_call + tool_result turns; increment counters
8. Append assistant turn
9. Update sessions.input_tokens, output_tokens, cache_*, turn_count
10. Return stream / final text
```

**Compression ordering (hard rule):** compression runs **before** the new user turn is appended to the **old** session (**17-session-lifecycle.md**). The triggering user message lands in the **continuation** session.

**Prefix-cache rule:** never splice tool results or turn content into the static system prompt mid-session (**15**, `00-overview.md`). Continuation block from compression is the only mid-session prefix extension — appended once after compress.

---

## Session open / close wiring

**20** calls **11** handlers; does not reimplement insert/finalize.

### Open (chat)

```typescript
const { sessionId, systemPrompt } = await openSession(database, userId, {
  sessionType: 'chat',
  model: 'claude-sonnet-4-6',
})
// openSession schedules session_watchdog [11]
// openSession calls buildSystemPrompt [15]
```

**Active session guard:** prefer **11** `readActiveUserSession` — reject second concurrent `chat` open or resume existing active chat row (product policy TBD — document as **20** G6).

### Close

```typescript
await closeSession(database, sessionId, {
  endReason: 'completed' | 'user_closed' | 'error',
  outcomeSummary: agentWrittenSummary,
})
// cancel watchdog [11]
// optional: embedAndStoreSession [17]
```

**Outcome summary:** agent generates at close via final `generateText` step or dedicated close prompt — quality owned by **20** + product; storage contract owned by **11**.

---

## Tool execution loop

**Layer split** (`build-guide/05-brain/07-agent-framework-hardening.md`):

- **Cloudflare Agents SDK** — durable DO, `waitUntil`, `keepAliveWhile`, WebSocket entry.
- **Vercel AI SDK** — `tool()`, `streamText`, `generateText`, `maxSteps`, `onStepFinish`.

```typescript
const tools = getBrainTools(
  database,
  userId,
  sessionKind,
  activeSessionId,
  (promise) => ctx.waitUntil(promise),
  buildAlarmWakeCallbacks(brain),
  env,
  sessionWebSearchCounter,
)

const result = streamText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  messages: turnsToCoreMessages(history),
  tools,
  maxSteps: 15,
  onStepFinish: async ({ usage, toolCalls, toolResults }) => {
    await persistToolSteps(database, activeSessionId, userId, toolCalls, toolResults, usage)
  },
})
```

**Wake injection:** `schedule_user_alarm` / `cancel_user_alarm` omitted unless `wake` passed (**09** G2, **19** G8). **20** must construct `AlarmWakeCallbacks` on `BrioelaBrain` (**09** G1, **11** G9).

**Web search injection:** `search_web` omitted unless `env` + `sessionWebSearchCounter` (**18** G4, **19** G16).

**Session activity counters:** tool executables increment `sessions.skills_created`, `constraints_proposed`, `memory_writes` fire-and-forget (**07-sessions.md**) — **20** ensures `activeSessionId` is passed into tools that need it.

---

## Turn append contract

**Target:** `append.session.turn.handler.ts`

Per **08-session-turns.md**:

| Field | Rule |
|---|---|
| `turn_number` | Monotonic counter in `agent_state` key `turn_counter.{sessionId}` — never `MAX(turn_number)` |
| `role` | `user` \| `assistant` \| `tool_call` \| `tool_result` |
| Immutability | Insert-only; no updates |
| Ordering load | `ORDER BY turn_number ASC` for prompt assembly |

**Token accumulation:** per-turn `input_tokens` / `output_tokens` on row; session totals incremented atomically via **11** `incrementSessionCounters`.

---

## SessionKind ↔ DB `session_type` mapping

**20** must translate before `getBrainTools`:

| DB `sessions.session_type` | `SessionKind` for tools | Notes |
|---|---|---|
| `chat` | `chat` | Full chat matrix |
| `cooking` | `cooking` | Brain-side cooking if ever inline; Mira usually owns row |
| `alarm` | `alarm` | Restricted tools |
| `background` | `brain_maintenance` OR `behavior_pattern_detection` | Derive from `sessions.alarm_type` |

```typescript
function mapSessionTypeToKind(
  sessionType: BrainSession['sessionType'],
  alarmType: string | null,
): SessionKind {
  if (sessionType === 'background') {
    if (alarmType === 'behavior_pattern_detection') return 'behavior_pattern_detection'
    return 'brain_maintenance'
  }
  return sessionKindSchema.parse(sessionType)
}
```

Gap **11** G14, **19** G15 — mapper owned by **20** call sites.

---

## Compression orchestration (caller only)

**20** invokes; **13** implements:

| Function | When |
|---|---|
| `checkCompressionNeeded(sessionId)` | Before every user turn (chat + inline alarm if long) |
| `runCompression(sessionId, userId)` | When check true |
| `applyCompression` | Inside **13** — marks old `compressed`, inserts child, returns last 10 turns |

After compress, **20** updates in-memory `activeSessionId`, appends continuation context to prompt (**13** `formatContinuationContext`), continues loop.

**Mira:** same threshold check documented in **13** spec — Mira runtime must call Brain RPC or shared helper before Gemini turns on long cooking sessions.

---

## Session close hooks

| Hook | Owner | When |
|---|---|---|
| Cancel `session_watchdog` | **11** | `closeSession` |
| Write `outcome_summary` | **11** row update; **20** generates text | Clean close |
| `embedAndStoreSession` | **17** | After close/compress — async via `waitUntil` |
| `reembedSessionOnCompress` | **17** | After **13** `applyCompression` |
| Clear `agent_state` turn counter | **11** / **20** | Close |

---

## Streaming and keep-alive

Long `streamText` runs should use Agents SDK `keepAliveWhile` per **07-agent-framework-hardening.md** so DO eviction mid-stream is less likely.

**Fibers:** optional for post-close summarization; not required for single-turn chat MVP.

---

## Mira scene differences (29 / 30)

| Scene | Runtime | Model | Tool path |
|---|---|---|---|
| `cooking` | MiraSession DO | Gemini Live | Gemini declarations + Brain forward |
| `bela_shopper`, `menu_language_bridge`, … | MiraSession + scene | Gemini Live (typical) | Scene `capabilities` filter |
| Brain `chat` | BrioelaBrain inline | Claude AI SDK | `getBrainTools` full matrix |

**No `MiraSceneKind` for plain text chat** — ambient Brain chat is **not** a Mira scene. Mobile text UX calls **20** on Brain directly.

Speech/scene policy (**30**) does not apply to Brain text chat.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **20** (this) | Turn loop, append turns, `getBrainTools` invocation, compression **call**, chat entrypoint, shared bounded loop for inline alarms |
| **11** | `openSession`, `closeSession`, watchdog schedule/cancel, session repos |
| **13** | Compression thresholds, `runCompression`, continuation assembly |
| **15** | `buildSystemPrompt` |
| **19** | `getBrainTools` registry |
| **14** | Alarm dispatch; calls **20** loop for inline alarm sessions |
| **29** | MiraSession DO, Gemini, cooking tools, session end fiber |
| **30** | MiraSpeechDecisionEngine, proactive speech |

---

## Conflicts and resolutions

| Conflict | Sources | Resolution for **20** |
|---|---|---|
| Watchdog duration 2h/4h vs 2h/8h | `03-session-lifecycle.md` vs **17** | **Prefer 17** — **11** schedules; **20** unaffected |
| Watchdog payload `sessionId` vs `session_id` | build-guide vs **17** | **Prefer `session_id`** in JSON |
| `runSession` in `02-tool-protocol.md` passes wrong `getBrainTools` arity | build-guide | Use full signature with `activeSessionId`, `waitUntil`, `wake` |
| `SessionCallerType` vs `SessionKind` | ledger **0001** memory tools | **SessionKind** + Zod at boundary |
| Mira writes cooking session row | **07-sessions.md** | **20** chat open must not collide; separate `session_type` |
| Cloudflare Sessions API | **07-agent-framework-hardening.md** | **Do not adopt** — keep custom `session_turns` |
| Inline alarm `maxTurns` | **14** | Default 3–5 turns; separate from chat `maxSteps` tool loop |
| Build-guide `end_reason: user_ended` vs schema `completed` | cooking **06-session-end** | Brain chat uses **17** enum values |

---

## Obsolete ledgers (do not implement from these alone)

| Ledger | Issue |
|---|---|
| `08-framework-hardening/0001.chat-entrypoint.md` | Correct scope — still open; use with this spec |
| `05-session-lifecycle/0004.session-compression.md` | Open; implementation belongs to **13**, caller to **20** |
| `03-tool-protocol/implementation/0004.alarm-tools.md` | "Wire in session handler" — still valid **20** action |
| `07-sub-agents/0003.session-context-compressor.md` | Obsolete summary fields — **prefer 17** |

---

## Sources

### Implementable specs

- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/00-overview.md` (prefix cache, write authority)
- `implementable-specs/cooking-session/02-mira-session.md`
- `implementable-specs/cooking-session/03-gemini-session.md`
- `implementable-specs/cooking-session/04-tool-protocol.md`
- `implementable-specs/cooking-session/08-session-end.md`

### Build guides

- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `build-guide/08-cooking-session/02-mira-session-do.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `build-guide/30-mira/00-overview.md`
- `build-guide/30-mira/01-scene-contract.md`

### Ledgers

- `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0003.session-close.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`

### Feature cross-refs

- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/13-brain-session-compression/spec.md` (Integration — feature 20)
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/15-brain-system-prompt/spec.md`
- `_features/19-brain-tool-registry/spec.md`
- `_features/12-brain-sub-agents/spec.md` (agent inventory, Brain vs Mira)

### Production

- `backend/src/agents/brain/brioela.brain.agent.ts` (memory RPC only — no chat)
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
