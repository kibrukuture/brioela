# Status

open

**Chat runtime not shipped.** `BrioelaBrain` has migration boot + memory RPC only. No `streamText`, no turn append, no `@callable() chat()`, no session handler wiring. Feature is the Brain capstone — blocked by **10–19** partial gaps.

# Shipped in backend (partial — foundation only)

- [x] `BrioelaBrain` DO + SQLite migration runtime (**04**)
- [x] Memory callable RPC (`appendMemoryEvent`, `listMemoryEvents`, `checkReadiness`)
- [x] `sessions` / `session_turns` Drizzle schemas + FTS migrations (**04**)
- [x] Partial `getBrainTools` — 8 tools, wake-gated alarms (**19**)
- [ ] `_handlers/chat.entrypoint.handler.ts`
- [ ] `_handlers/run.chat.turn.handler.ts`
- [ ] `_handlers/append.session.turn.handler.ts`
- [ ] `_handlers/run.bounded.turn.loop.handler.ts`
- [ ] `@callable() chat()` / `onMessage` entrypoint
- [ ] `streamText` / `generateText` model loop
- [ ] Turn append + session counter updates
- [ ] Compression check before turn (**13** caller)
- [ ] `openSession` / `closeSession` integration (**11**)
- [ ] `buildSystemPrompt` at open (**15**)
- [ ] `AlarmWakeCallbacks` on Brain DO (**09** G1)
- [ ] `mapSessionTypeToKind` helper (**11** G14)
- [ ] Chat runtime Workers tests
- [ ] MiraSession DO (**29** — separate feature)

# Open gaps (hunt list)

| ID | Gap | Evidence / owner |
|---|---|---|
| G1 | No chat entrypoint on `BrioelaBrain` | `brioela.brain.agent.ts` — memory RPC only; ledger **0001** `[ ] Open` |
| G2 | No `streamText` / `generateText` in brain package | `rg streamText backend/src/agents/brain` — zero |
| G3 | No turn append handler | **11** G13; no `_handlers/` directory |
| G4 | No session open/close handlers to call | **11** G1–G2 |
| G5 | No `buildSystemPrompt` at session start | **15** — handler missing |
| G6 | No active session guard on chat open | **11** G23 — concurrent active rows |
| G7 | No compression check before turn | **13** G — caller missing; ledger **0004** open |
| G8 | `getBrainTools` missing 10+ tools | **19** G2–G5 — skills, constraints, session, web |
| G9 | No caller passes `wake` — alarm tools dead | **09** G2, **19** G8 |
| G10 | No `AlarmWakeCallbacks` on Brain DO | **11** G9, **09** G1 |
| G11 | No `mapSessionTypeToKind` for `background` rows | **19** G15, **11** G14 |
| G12 | No `waitUntil` passed to tools needing async | `read_user_memory`, future **18** web |
| G13 | No web search counter + env injection | **18** G4, **19** G16 |
| G14 | No `runBoundedTurnLoop` for inline alarms | **14** draft `run.inline.alarm.session.handler.gap.md` |
| G15 | No outcome summary generation at close | **11** close handler + **20** close prompt TBD |
| G16 | No Vectorize hook at close/compress | **17** — `waitUntil` embed not wired |
| G17 | No chat RPC Zod schemas | Pattern: `_rpc/chat.rpc.ts` missing |
| G18 | `BrioelaIdentity` missing — prompt Block 1 | **10** G1 |
| G19 | Session repos missing | **11** G3 |
| G20 | Tool loop `maxSteps` / `onStepFinish` not implemented | `02-tool-protocol.md:151-157` |
| G21 | Prefix-cache violation risk if turns spliced into system prompt | Documented in **15** — enforce in **20** |
| G22 | Mira dual-writer not implemented | **29** — no Mira DO; **07-sessions.md** contract open |
| G23 | Cooking compression on Mira path undocumented in code | **13** spec — Mira must honor thresholds |
| G24 | No Agents SDK `onMessage` / chat hook wired | **07-agent-framework-hardening.md** |
| G25 | No `keepAliveWhile` around long streams | **07-agent-framework-hardening.md** — hardening gap |

# Blocked by

| Feature | Blocker |
|---|---|
| **10** | `BrioelaIdentity` for system prompt Block 1 |
| **11** | `openSession`, `closeSession`, session repos, watchdog schedule/cancel |
| **13** | `checkCompressionNeeded`, `runCompression` — **20** is caller only but needs handlers |
| **15** | `buildSystemPrompt` |
| **19** | Complete tool matrix + injection signature |
| **09** | `AlarmWakeCallbacks` contract on DO |
| **14** | Optional parallel — inline alarm shell can ship with **20** loop |
| **06**, **07**, **16**, **18** | Missing tools reduce chat capability until **19** registers them |

# Blocks

- End-to-end Brain chat product surface
- **14** inline alarm LLM sessions (`sickness_followup`, `travel_preload`, …)
- Mobile Brain text/voice RPC (future)
- Tool executables' session counter side effects (**06** G11, **07** G7, **08** G6)
- Ledger **0001.chat-entrypoint.md** closure

# Brain vs Mira split (status)

| Path | Shipped? | Owner |
|---|---|---|
| Brain inline chat (`streamText`, Claude) | No | **20** |
| Inline alarm bounded loop | No | **20** + **14** |
| MiraSession + Gemini Live | No | **29** / **30** |
| Mira → Brain tool forward | No | **29** calls Brain RPC (**20** exposes tool execution surface) |

# Obsolete ledgers

| Ledger | Issue |
|---|---|
| `brain/07-sub-agents/0003.session-context-compressor.md` | Wrong summary schema — **prefer 17** |
| `brain/05-session-lifecycle/0002.system-prompt-builder.md` | Belongs to **15**, not **20** |
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Wrong FTS/kinds — **prefer 16** |

Still authoritative for **20** scope: `brain/08-framework-hardening/0001.chat-entrypoint.md`.

# Cross-feature conflicts

| Conflict | Resolution for **20** |
|---|---|
| `runSession` pseudocode missing wake/env | Use full `getBrainTools` signature |
| Watchdog durations build-guide vs **17** | **20** unaffected — **11** schedules per **17** |
| Mira vs Brain session row writers | Chat sessions **20** only; cooking **29** |
| Cloudflare Sessions API vs custom turns | Keep **08** `session_turns` |
| Inline alarm `maxTurns` vs chat `maxSteps` | Both — alarm bounded turns, chat bounded tool steps |

# Sources

- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/cooking-session/03-gemini-session.md`
- `implementable-specs/cooking-session/04-tool-protocol.md`
- `build-guide/08-cooking-session/02-mira-session-do.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `build-guide/30-mira/00-overview.md`
- `build-guide/30-mira/01-scene-contract.md`
- `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0003.session-close.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/13-brain-session-compression/spec.md`
- `_features/14-brain-alarm-dispatch/spec.md`
- `_features/15-brain-system-prompt/spec.md`
- `_features/19-brain-tool-registry/spec.md`
- `_features/19-brain-tool-registry/status.md`
- `backend/src/agents/brain/brioela.brain.agent.ts`
- `backend/src/agents/brain/_tools/get.brain.tools.ts`

# Draft count

**10** files in `draft/` — 1 production snapshot + 8 intended handler/helper/RPC/test gaps + `gap-index.md`.
