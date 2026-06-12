# Status

open

**Session tools not shipped.** FTS5 on `sessions.outcome_summary` exists (**04**). No `load_session_context`, no `search_session_history`, no session tool repositories, no `getBrainTools` registration, no tests.

# Shipped in backend (partial — FTS spine only)

- [x] `sessions_fts` + `sessions_fts_trigram` virtual tables + sync triggers — `drizzle/0001_add_fts_and_triggers.sql`
- [x] `session_turns_fts*` (not used by feature **16** tool 17)
- [x] FTS Latin + trigram tests in `run.migrations.handler.test.ts`
- [x] `sessions` / `session_turns` / `scheduled_alarms` / `user_memory` schemas
- [x] Alarm read repos (**09**)
- [x] Memory read repos partial (**05**)
- [x] `get.brain.tools.ts` — `SessionKind` + `TOOL_PERMISSIONS` (no session tools yet)
- [ ] `load.session.context.tool.ts` + split layout
- [ ] `search.session.history.tool.ts` + split layout
- [ ] `read.session.tools.repository.ts`
- [ ] `is.non.latin.query.helper.ts`
- [ ] Session tools in `TOOL_PERMISSIONS`
- [ ] `session.tools.test.ts`
- [ ] **11** session repos + completed rows with `outcome_summary`

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `load.session.context.tool.ts` | `rg load_session_context backend` — zero |
| G2 | No `search.session.history.tool.ts` | `rg search_session_history backend` — zero |
| G3 | No session tool schemas/prompts/executables | `_tools/_schemas/` — no load/search session files |
| G4 | No `read.session.tools.repository.ts` | `_repositories/index.ts` — no session exports |
| G5 | Session tools not in `getBrainTools` | `get.brain.tools.ts` — `TOOL_PERMISSIONS` lacks both tools |
| G6 | No `is.non.latin.query.helper.ts` | `rg isNonLatin backend` — zero |
| G7 | No `session.tools.test.ts` | Ledger **0006** suggests tests; file missing |
| G8 | **11** session repos missing | **11** G3 — load/search need completed session rows |
| G9 | No completed sessions with `outcome_summary` in prod path | **11** G1/G2 — close handler not built |
| G10 | `listPendingAlarmsForSessionContext` not built | **09** has single-alarm reads; no list-all-pending |
| G11 | `listDistinctActiveMemoryNamespaces` not built | **15** G11 — same query needed |
| G12 | **20** does not call `load_session_context` at first turn | Chat entrypoint open |
| G13 | Vectorize semantic path not in tool | **17** stub; tool spec **17** line 178 — FTS only in **16** |
| G14 | Turn-level FTS has no tool | `08-session-turns.md` documents path; not in brioela-tools index |
| G15 | Compressed sessions excluded from search/load | Tool spec filters `status = 'completed'` only — `compressed` rows invisible until product extends filter |
| G16 | Abandoned sessions excluded from search | Same `completed` filter — only load tool's `last_abandoned_session` surfaces them |
| G17 | Pending alarm scope differs from **15** Block 7 | Tool includes `session_watchdog`; builder excludes — intentional divergence undocumented in code |
| G18 | `user_id` filter on FTS join not in spec pseudocode | Security requirement — must implement in executable |
| G19 | `current_session_id` validation | Tool accepts UUID; should verify row belongs to `userId` |
| G20 | Alarm session gets load but not search | Permission matrix decision — not yet in `TOOL_PERMISSIONS` |
| G21 | Ledger **0006** wrong implementation target | Searches `session_turns_fts`; spec searches `sessions_fts` — **prefer spec** |
| G22 | Build-guide `02-tool-protocol.md` wrong FTS table | Line 124: `session_turns` — **prefer implementable spec 17** |
| G23 | `00-overview.md` implies load injected into prefix | Tool spec: agent calls once — **20** orchestration gap |
| G24 | Overlap with **15** blocks 7–9 | Duplicate reads — acceptable; dedupe policy for **20** |
| G25 | JSON `outcome_summary` on compressed rows in FTS index | Compression (**13**) stores JSON string — may pollute FTS matches if filter extended |

# 16 vs neighbor boundaries

| In **16** (this feature) | In separate feature |
|---|---|
| `load_session_context` tool + executable | `openSession` — **11** |
| `search_session_history` tool + FTS on `sessions_fts*` | Vectorize semantic search — **17** |
| Session tool read repositories | Base session repos — **11** |
| `isNonLatinQuery` helper | — |
| `getBrainTools` session permissions | Full tool registry polish — **19** |
| Script-aware FTS routing | FTS DDL + triggers — **04** (shipped) |
| Pending alarms + namespace reads in load tool | Same data in `buildSystemPrompt` — **15** |
| Turn-level FTS (`session_turns_fts`) | Direct read only — no tool; future feature TBD |
| `outcome_summary` content at close | Agent writes summary — **11** / **20** |
| Compressed JSON summaries searchable? | Compression shape — **13**; filter policy **G15** |

# Blocked by

- 04-brain-foundation (FTS — shipped)
- 09-brain-alarm-tools (repos — shipped; list-pending gap)
- 05-brain-memory-tools (namespace list pattern)
- 11-brain-sessions-lifecycle (completed rows + repos)

# Blocks

- 20-brain-chat-runtime (first-turn load orchestration)
- 17-brain-vectorize (complementary — not blocking FTS tool)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Wrong tool behavior: load by ID returns `found: false`; search `session_turns_fts` with `snippet()`; `general` session kind; cooking denied tools; maintenance gets load — **superseded by implementable specs 16/17 + this feature** |

# Ambiguous / conflicting sources

1. **FTS target:** `02-tool-protocol.md` + ledger **0006** → `session_turns_fts`. **`17-search-session-history.md`** + **`07-sessions.md`** → `sessions_fts` on `outcome_summary`. **Prefer implementable tool spec.**
2. **Semantic search in tool:** `03-vectorize.md` embeds semantic path in `search_session_history`. Tool spec **17** says Vectorize is separate. **16 = FTS only.**
3. **Cooking tool access:** Ledger denies cooking both tools. Spec **16** requires cooking at start. **Prefer spec 16.**
4. **Maintenance load access:** Ledger gives maintenance `load_session_context` only. Spec **16** says NOT maintenance. **Prefer spec 16.**
5. **Compressed session search:** `completed` filter excludes `compressed` — **G15**; chain summaries only via **13** continuation or future filter extension.
6. **Pending alarms:** Tool all pending vs **15** excludes watchdog — implement both; document in **20**.
7. **`brioela-tools/00-index.md` line 54:** Says search by "keyword or meaning" — meaning is **17** Vectorize, not **16** FTS tool.
8. **Hybrid search (`08-session-turns.md`):** FTS5 + Vectorize merge — **17** + direct turn reads; not **16** scope.

# Tools discovered (complete list)

1. `load_session_context` — `implementable-specs/brioela-tools/16-load-session-context.md`
2. `search_session_history` — `implementable-specs/brioela-tools/17-search-session-history.md`

No additional session tools in specs, ledgers, or production.

# Sources

- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/18-vectorize.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/10-scheduled-alarms.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/06-brain-memory/03-vectorize.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/13-brain-session-compression/spec.md`
- `_features/13-brain-session-compression/status.md`
- `_features/15-brain-system-prompt/spec.md`
- `_features/15-brain-system-prompt/status.md`
- `backend/src/agents/brain/drizzle/0001_add_fts_and_triggers.sql`
- `backend/src/agents/brain/_migrations/run.migrations.handler.test.ts`
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
- `backend/src/agents/brain/_schemas/session.schema.ts`
- `backend/src/agents/brain/_repositories/index.ts`

# Draft count

**12** files in `draft/` — full intended production snapshots for tools, repos, helper, permissions note, and tests.
