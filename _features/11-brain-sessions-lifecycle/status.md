# Status

open

**Lifecycle handlers not shipped.** `sessions` and `session_turns` schemas, FTS5 sync, and alarm repositories exist (**04**, **09**). No `openSession`, no `closeSession`, no session repositories, no watchdog schedule/cancel on open/close. Feature is not done per full spec.

# Shipped in backend (partial — schema spine only)

- [x] `_schemas/session.schema.ts` — four session types, four statuses, token/counter columns, six indexes
- [x] `_schemas/session.turn.schema.ts` — four roles, turn_number ordering, two indexes
- [x] Migration `0000` — CREATE `sessions`, `session_turns`
- [x] Migration `0001` — `sessions_fts`, `sessions_fts_trigram`, turn FTS + AFTER INSERT/UPDATE/DELETE triggers
- [x] Migration `0007` — `scheduled_alarms.triggering_session_id` + partial index (watchdog cancel lookup)
- [x] FTS sync verified in `run.migrations.handler.test.ts` (Latin + trigram paths)
- [x] `writeUserAlarm`, `cancelUserAlarm`, `readPendingUserAlarmByType`, `readEarliestPendingScheduledAt` (**09**)
- [ ] `open.session.handler.ts` / `close.session.handler.ts`
- [ ] Session read/write repositories
- [ ] `session_watchdog` scheduled at session open
- [ ] `session_watchdog` cancelled at session close
- [ ] `buildSystemPrompt` called at open (**15** — handler missing)
- [ ] `BrioelaBrain` session/chat callable surface (**20**)
- [ ] `AlarmWakeCallbacks` on Brain DO (**09** G1)
- [ ] Session lifecycle unit tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `open.session.handler.ts` | Ledger `0001.session-open.md` Status `[ ] Open`; no `_handlers/` in brain package |
| G2 | No `close.session.handler.ts` | Ledger `0003.session-close.md` open; `rg closeSession backend/src/agents/brain` — zero |
| G3 | No session repositories | `_repositories/index.ts` — no read/write session exports |
| G4 | `BrioelaBrain` has no session methods | `brioela.brain.agent.ts` — memory RPC only; no open/close/chat |
| G5 | Watchdog never scheduled on open | `17-session-lifecycle.md` requires `writeUserAlarm(session_watchdog)` at open — no caller |
| G6 | Watchdog never cancelled on close | `closeSession` cancel path not implemented |
| G7 | `buildSystemPrompt` missing — open cannot return prompt | Ledger `0002.system-prompt-builder.md` open; **15** stub |
| G8 | `BrioelaIdentity` missing — prompt Block 1 blocked | **10** G1 — no `identity-prompt.ts` |
| G9 | `AlarmWakeCallbacks` not on Brain DO | **09** G1 — `getBrainTools` omits alarm tools without `wake`; open cannot refresh slot |
| G10 | Watchdog dispatch not built | **14** — `dispatch.alarm.handler.ts` missing; ledger `06-alarm-system/0001` open |
| G11 | Compression not built | **13** — `compress.session.handler.ts` missing; ledger `0004` open |
| G12 | Session tools not built | **16** — `load_session_context`, `search_session_history` missing |
| G13 | Turn append loop not built | **20** — no handler writes `session_turns` or increments counters |
| G14 | `SessionKind` ≠ DB `session_type` | `get.brain.tools.ts`: `brain_maintenance` / `behavior_pattern_detection` vs DB `background` — mapping helper missing |
| G15 | Watchdog duration conflict | `03-session-lifecycle.md` + `05-alarm-system.md`: 2h/4h; `17-session-lifecycle.md`: 2h/8h/1h/1h — **prefer 17** |
| G16 | Watchdog handler complexity conflict | Build-guide: mark abandoned if still active; **17**: inactivity thresholds + reschedule — **prefer 17** for **14** |
| G17 | Payload key drift | Build-guide `sessionId` vs **17** `session_id` in JSON payload |
| G18 | `closeSession` signature drift | Build-guide omits `endReason`; **17** requires it |
| G19 | Compression summary field drift | Ledger `07-sub-agents/0003` uses `topics/decisions/open_items/behavior_signals`; **17** uses `intent/accomplished/decisions/continuing` — **prefer 17**; ledger 0003 obsolete |
| G20 | No `compressionSummary` column (correct) | Build-guide pseudocode references column not in shipped schema; **17** stores JSON in `outcome_summary` when `compressed` |
| G21 | `userPersonality.status` in build-guide pseudocode | Shipped schema uses `isActive` boolean — **15** gap |
| G22 | Mira dual-writer contract undocumented in code | `07-sessions.md`: MiraSession writes cooking rows — no Mira DO in backend yet (**29**) |
| G23 | Active session guard not implemented | Spec: 0–1 active rows; no `readActiveUserSession` or open guard |
| G24 | Smoke `brain.active.session` not in migration smoke table | **04** G7 — active session query untested in smoke handler |
| G25 | Ledger `0006.session-tools` describes wrong FTS target | Says search `session_turns` FTS; tool spec **17** searches `sessions` outcome FTS — **prefer tool spec** |

# 11 vs neighbor boundaries

| In **11** (this feature) | In separate feature |
|---|---|
| `openSession`, `closeSession` handlers | `buildSystemPrompt` — **15** |
| Session row insert/finalize repos | `BrioelaIdentity` — **10** |
| Watchdog **schedule** at open, **cancel** at close | Watchdog **dispatch** + inactivity — **14** |
| Session kind semantics + DB `session_type` | `SessionKind` tool matrix — **19** / existing `get.brain.tools.ts` |
| `sessions` / `session_turns` schema consumption | Schema DDL — **04** (shipped) |
| Lifecycle contracts for Mira callback | Mira DO implementation — **29** |
| Compression cancel-old + open-continuation **contract** | `runCompression`, compressor agent — **13** |
| `outcome_summary` write at close | Agent-generated summary content quality — **20** / product |
| `load_session_context`, `search_session_history` | **16** |
| Turn append, token accumulation | **20** |

# Blocked by

- 04-brain-foundation (schemas + FTS — shipped)
- 09-brain-alarm-tools (repos — shipped; wake G1 open)
- 10-brain-agent-identity (Block 1 — open)
- 15-brain-system-prompt (`buildSystemPrompt` — open)

# Blocks

- 13-brain-session-compression
- 14-brain-alarm-dispatch (watchdog schedule side defined here)
- 16-brain-session-tools
- 20-brain-chat-runtime
- 12-brain-sub-agents (background session open path)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `brain/07-sub-agents/0003.session-context-compressor.md` | Wrong summary fields (`topics/open_items/...`); wrong status transition (`completed` not `compressed`); `sessionType: 'general'` invalid — **superseded by 17 + 0004** |
| `brain/06-alarm-system/0001.alarm-dispatch.md` | Uses status `'fired'` — not in schema; use `completed` |
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Partially wrong: FTS search target, `general` session kind — **superseded by 16 tool specs** |
| `brain/05-session-lifecycle/0002.system-prompt-builder.md` | Correctly open but belongs to **15** build scope — keep as cross-ref |

# Ambiguous / conflicting sources

1. **Watchdog durations:** `03-session-lifecycle.md` + `05-alarm-system.md` = 2h chat / 4h cooking. **`17-session-lifecycle.md`** = 2h / 8h / 1h / 1h. **Prefer 17** for implementation.
2. **Watchdog fire behavior:** Build-guide simple abandon vs **17** inactivity + reschedule. **Prefer 17** in **14** dispatch; **11** only schedules/cancels.
3. **Watchdog payload key:** `sessionId` (build-guide) vs `session_id` (**17**). **Prefer `session_id`** in JSON payload.
4. **Compression summary schema:** Sub-agent ledger 0003 vs **17** four-field schema. **Prefer 17** (`intent`, `accomplished`, `decisions`, `continuing`).
5. **System prompt block order:** `00-overview.md` skills before personality/memory vs **16-agent-identity** + **03-session-lifecycle**. **Prefer 16 + build-guide** for **15**.
6. **SessionKind vs session_type:** Tool registry has maintenance kinds; DB has `background`. **11** must document mapping — no single enum in specs.
7. **Who writes cooking session row:** **07-sessions** says both DOs write; Mira build guide says Brain creates Mira DO. **29** must reconcile; **11** owns Brain-side contract.
8. **`load_session_context` vs system prompt Block 6:** Tool loads last 3 completed + pending alarms; builder loads single last `outcome_summary`. Both valid — tool is richer mid-start hydration (**16**).

# Sources

- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0001.session-open.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0002.system-prompt-builder.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0003.session-close.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md`
- `_features/04-brain-foundation/status.md`
- `_features/09-brain-alarm-tools/status.md`
- `_features/10-brain-agent-identity/status.md`

# Draft count

**10** files in `draft/` — 4 production snapshots (schemas + FTS + migration 0007) + 5 gap snapshots (handlers/repos/schema) + 1 SessionKind reference note.
