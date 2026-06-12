# Brain Chat Runtime — Build

Feature **20**. Production paths under `backend/src/agents/brain/` for chat entrypoint, turn loop, turn append, and Brain DO wiring.

**Depends on:** **11** open/close + session repos; **13** compression handlers; **15** `buildSystemPrompt`; **19** complete `getBrainTools`; **09**/**14** `AlarmWakeCallbacks`; partial **05–18** tools.  
**Blocks:** End-to-end Brain chat; **14** inline alarm LLM sessions; mobile Brain chat RPC.

---

## Shipped today

| Area | Status |
|---|---|
| `BrioelaBrain` DO class + migration boot | ✓ (**04**) |
| Memory RPC (`appendMemoryEvent`, `listMemoryEvents`) | ✓ |
| `getBrainTools` partial registry | ✓ (**19** — 8 tools) |
| `sessions` / `session_turns` schemas + FTS | ✓ (**04**) |
| `_handlers/chat.entrypoint.handler.ts` | ✗ |
| `_handlers/run.chat.turn.handler.ts` | ✗ |
| `_handlers/append.session.turn.handler.ts` | ✗ |
| `_handlers/run.bounded.turn.loop.handler.ts` | ✗ (shared with **14**) |
| `_helpers/map.session.kind.helper.ts` | ✗ |
| `_helpers/build.alarm.wake.callbacks.helper.ts` | ✗ |
| `open.session.handler.ts` | ✗ (**11**) |
| `close.session.handler.ts` | ✗ (**11**) |
| `compress.session.handler.ts` | ✗ (**13**) |
| `build.system.prompt.handler.ts` | ✗ (**15**) |
| `@callable() chat()` on `BrioelaBrain` | ✗ |
| `onMessage` / Agents SDK chat hook | ✗ |
| Turn append + counter increment | ✗ |
| `streamText` / `generateText` integration | ✗ |
| Chat runtime tests | ✗ |
| MiraSession DO | ✗ (**29**) |

**Zero chat runtime production code.** `rg streamText backend/src/agents/brain` — no matches. `brioela.brain.agent.ts` — 65 lines, memory RPC only.

---

## File manifest

### Brain DO (20 core)

| File | Role |
|---|---|
| `brioela.brain.agent.ts` | Add `@callable() chat`, `onMessage`, `alarm()` stub → **14**, `buildAlarmWakeCallbacks`, delegate to handlers |
| `_handlers/chat.entrypoint.handler.ts` | `handleChatMessage` — session resolve, compress check, turn loop, optional close |
| `_handlers/run.chat.turn.handler.ts` | Single chat turn: append user → `streamText` → append assistant → counters |
| `_handlers/run.bounded.turn.loop.handler.ts` | Shared loop for **14** inline alarms — `generateText`, `maxTurns` cap |
| `_handlers/append.session.turn.handler.ts` | Insert `session_turns` row; manage `turn_counter.{sessionId}` in agent_state |
| `_helpers/map.session.kind.helper.ts` | DB `session_type` + `alarm_type` → `SessionKind` |
| `_helpers/build.alarm.wake.callbacks.helper.ts` | `AlarmWakeCallbacks` from Brain DO ctx |
| `_helpers/turns.to.core.messages.helper.ts` | Map `session_turns` rows → AI SDK `CoreMessage[]` |
| `_helpers/session.web.search.counter.helper.ts` | Per-session web search budget (**18**) |
| `_rpc/chat.rpc.ts` | Zod schemas + types for `chat()` callable |
| `_handlers/chat.runtime.test.ts` | Workers pool E2E: open → message → turn row |

### Consumers (built elsewhere — verify at **20** ship)

| File | Role |
|---|---|
| `_handlers/open.session.handler.ts` | **11** — called by chat entry |
| `_handlers/close.session.handler.ts` | **11** |
| `_handlers/compress.session.handler.ts` | **13** — called before turn |
| `_handlers/build.system.prompt.handler.ts` | **15** |
| `_handlers/run.inline.alarm.session.handler.ts` | **14** — calls **20** bounded loop |
| `_tools/get.brain.tools.ts` | **19** |
| `_repositories/read.user.session.repository.ts` | **11** |
| `_repositories/write.user.session.repository.ts` | **11** |

### Mira (29 — not built in 20)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-session.agent.ts` | Separate wrangler binding — Gemini path |
| Cooking `_handlers/*` | Tool forward → Brain RPC |

---

## Handler contracts

### `handleChatMessage`

1. Parse `chatTurnInputSchema`.
2. Resolve `userId` from DO identity.
3. If no `sessionId`: `openSession(..., 'chat', model)`.
4. Else: `readUserSession` — must be `active` + `chat`.
5. `checkCompressionNeeded` → `runCompression` if true; swap `sessionId`.
6. `runChatTurn(sessionId, userMessage)`.
7. If `closeAfterTurn`: generate outcome summary + `closeSession`.
8. Return stream handle or structured response.

### `runChatTurn`

1. `appendSessionTurn({ role: 'user', content })`.
2. Load ordered turns; `turnsToCoreMessages`.
3. `kind = mapSessionTypeToKind(session.sessionType, session.alarmType)`.
4. `tools = getBrainTools(..., kind, sessionId, waitUntil, wake, env, counter)`.
5. `streamText` with `maxSteps: 15`, `onStepFinish` → append tool turns + usage.
6. `incrementSessionCounters` on `sessions` row.
7. Return `result`.

### `appendSessionTurn`

1. Read/increment turn counter from agent_state.
2. Insert immutable row per **08**.
3. For tool rows: populate `tool_name`, `tool_input`, `tool_result`.

### `buildAlarmWakeCallbacks(brain)`

1. Wrap `ctx.storage.setAlarm` / cancel per **09** MIN-pending contract.
2. Passed to every `getBrainTools` call from **20**.

---

## Acceptance criteria

### Entrypoint

- [ ] `@callable() chat()` validates input with Zod; rejects unknown session ids
- [ ] New chat opens session via **11** `openSession` — watchdog scheduled
- [ ] Resume reuses active `chat` session row
- [ ] Agents SDK `onMessage` (or documented equivalent) delegates to same handler

### Turn loop

- [ ] User message persisted before model call
- [ ] Assistant + tool turns persisted after model completes
- [ ] `turn_number` monotonic via agent_state — no MAX query
- [ ] Session `turn_count` and token columns updated each turn
- [ ] `maxSteps: 15` prevents infinite tool loops
- [ ] Static system prompt unchanged mid-session (except **13** continuation suffix once)

### Compression integration

- [ ] `checkCompressionNeeded` invoked before every user turn
- [ ] User turn after compress lands in **new** session id
- [ ] Continuation context visible to model after compress (**13**)

### Tool wiring

- [ ] `getBrainTools` called with `activeSessionId`, `waitUntil`, `wake`
- [ ] With `wake`, alarm tools appear in chat sessions
- [ ] With `env` + counter, `search_web` appears when **18** shipped
- [ ] `mapSessionTypeToKind` correct for `background` + `alarm_type`

### Session close

- [ ] Explicit close writes `outcome_summary` + `closeSession`
- [ ] Watchdog cancelled on close (**11**)
- [ ] **17** embed hook fired via `waitUntil` when shipped

### Inline alarm reuse

- [ ] `runBoundedTurnLoop` exported for **14** `runInlineAlarmSession`
- [ ] Alarm kind uses restricted tool matrix

### Tests

- [ ] `chat.runtime.test.ts`: migration boot → open session (mock **11** or real) → one turn → `session_turns` row exists
- [ ] Compression mock: threshold forced → new session id observed
- [ ] Tool step: memory tool call → `memory_writes` or event row side effect

### Boundaries

- [ ] No Gemini / Mira code in **20** handlers
- [ ] No compression threshold constants duplicated — import from **13**
- [ ] No `buildSystemPrompt` logic duplicated — import from **15**
- [ ] Guard/lexicon tooling not referenced

---

## Verification commands

```bash
rg 'streamText|generateText|handleChatMessage|runChatTurn|appendSessionTurn' backend/src/agents/brain
rg '@callable' backend/src/agents/brain/brioela.brain.agent.ts
cd backend && bun run brain:test
bun run verify
```

---

## 20 vs neighbors

| Step | Feature | Relationship |
|---|---|---|
| Open session | **11** | **20** calls at chat start |
| System prompt | **15** | Returned from open |
| Compress check | **13** | **20** calls before turn |
| Tools | **19** | **20** passes runtime deps |
| Alarm wake | **09**, **14** | **20** builds callbacks |
| Vectorize close | **17** | **20** triggers via `waitUntil` |
| Inline alarms | **14** | Imports bounded loop |
| Mira cooking | **29** | Separate DO; Brain RPC only |

---

## Draft artifacts

See `draft/` — production Brain agent snapshot + intended handler/helper/test gap files.
