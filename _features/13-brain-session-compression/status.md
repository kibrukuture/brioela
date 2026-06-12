# Status

open

**Session compression not shipped.** Schema spine supports `compressed` status and `parent_session_id` (**04**). No `compress.session.handler.ts`, no `compression.summary.schema.ts`, no threshold check, no continuation context helper, no compression repos, no tests. **12** SessionContextCompressor DO also missing — Haiku path blocked.

**Living catalog:** Thresholds and summary shape follow `implementable-specs/17-session-lifecycle.md` today. Product backbone (`brioela-specs/24`) describes a richer Mira-side compressor — document but do not implement from product spec alone; Brain **13** tracks **17**.

# Shipped in backend (partial — schema spine only)

- [x] `sessions.status` enum includes `'compressed'` — `session.schema.ts`
- [x] `sessions.parent_session_id` column + partial index `sessions_parent_index`
- [x] `sessions.outcome_summary` — stores JSON compression summary when compressed
- [x] `sessions.end_reason` — free text; `'compressed'` per **17**
- [x] `session_turns` — full transcript preserved; compression read source
- [ ] `_schemas/compression.summary.schema.ts`
- [ ] `_constants/compression.thresholds.constant.ts`
- [ ] `_handlers/compress.session.handler.ts`
- [ ] `_handlers/format.continuation.context.helper.ts`
- [ ] Compression read/write repositories
- [ ] Compression handler tests
- [ ] **12** SessionContextCompressor DO + Haiku handler
- [ ] **20** turn loop calling `checkCompressionNeeded`
- [ ] Vectorize re-embed on compress (**17**)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `compress.session.handler.ts` | Ledger `0004.session-compression.md` Status `[ ] Open`; `glob **/compress*` backend — zero |
| G2 | No `checkCompressionNeeded` | `rg checkCompression backend` — zero |
| G3 | No `applyCompression` / `runCompression` | `rg applyCompression backend` — zero |
| G4 | No `compression.summary.schema.ts` | `rg compressionSummarySchema backend` — zero |
| G5 | No threshold constants file | No 40/80 turn or 60k/100k constants in codebase |
| G6 | No continuation context formatter | No `[CONTINUATION CONTEXT` string builder |
| G7 | No `getFullSessionChain` helper | Chain walk from **17** not implemented |
| G8 | No session compression repositories | `_repositories/index.ts` — no compression exports |
| G9 | SessionContextCompressor DO missing | **12** G7 — blocks `runCompression` Haiku path |
| G10 | No wrangler binding for compressor | **12** G18 — `SESSION_CONTEXT_COMPRESSOR` absent |
| G11 | Turn loop does not call compression | **20** open; ledger `0001.chat-entrypoint.md` open |
| G12 | Session repos missing | **11** G3 — compression cannot read turns or write rows |
| G13 | Watchdog cancel on compress not wired | **11** G6 close path missing; **13** reuses same cancel |
| G14 | Watchdog schedule on continuation missing | **11** G5 open — new session needs fresh alarm |
| G15 | FTS search scope for compressed sessions unclear | **16** tool searches `completed` only — compressed sessions excluded from search tool until product decision |
| G16 | Vectorize upsert on compress not built | **17** stub; `18-vectorize.md` Session Compressed section |
| G17 | No compression handler tests | No `compress.session.handler.test.ts` |
| G18 | Build-guide inline Haiku vs DO split | `03-session-lifecycle.md` inlines `generateObject` on Brain binding — **prefer 12 DO + 13 orchestration** |
| G19 | Obsolete ledger **0003** schema | `topics/open_items/behavior_signals` arrays — **reject**; use **17** four strings |
| G20 | Build-guide `compressionSummary` column | Pseudocode writes nonexistent column — use `outcome_summary` |
| G21 | Build-guide child `sessionType: 'chat'` | **17** inherits parent type — cooking must stay `cooking` |
| G22 | Dual path `_context/` vs `_subagents/` | `01-do-class-and-setup.md` lists `_context/compress.session.context.handler.ts` and `_subagents/...` — **prefer _subagents** for Haiku (**12**) |
| G23 | Mira compressor not reconciled | `brioela-specs/24` sacred block / 50% trigger — separate from Brain **17** path (**29**) |
| G24 | `load_session_context` references compressor output | Ledger **0006** — tool not built (**16**); depends on **13** summary shape |
| G25 | Turn counter for threshold depends on **20** | `turn_count` / `input_tokens` must be accurate before check — **20** G13 |

# 13 vs neighbor boundaries

| In **13** (this feature) | In separate feature |
|---|---|
| Thresholds, `checkCompressionNeeded` | SessionContextCompressor DO — **12** |
| `runCompression` / `applyCompression` | Haiku call + system prompt — **12** |
| `compression.summary.schema.ts` | Compressor consumes schema — **12** |
| `formatContinuationContext` | `buildSystemPrompt` static blocks — **15** |
| Watchdog cancel + schedule on compress | Generic open/close — **11** |
| `getFullSessionChain` | Session repos base — **11** |
| Compression check invocation | Live turn loop — **20** |
| Vectorize re-embed after compress | **17-brain-vectorize** |
| Tools reading compressed summary | **16-brain-session-tools** |
| Mira live-session compressor | **29** / product **24** |

# Blocked by

- 04-brain-foundation (schema — shipped)
- 11-brain-sessions-lifecycle (repos, watchdog helpers — open)
- 12-brain-sub-agents (SessionContextCompressor — open)
- 09-brain-alarm-tools (alarm repos — shipped; wake G1 open)

# Blocks

- 20-brain-chat-runtime (compression hook in turn loop)
- 17-brain-vectorize (optional re-embed on compress)
- 16-brain-session-tools (reads four-field blob from compressed sessions)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `brain/07-sub-agents/0003.session-context-compressor.md` | Wrong fields (`topics/open_items/...`); `wasCompressed` flag; `status: completed` not `compressed`; `sessionType: 'general'` invalid; inline-only not DO — **superseded by 17 + 0004 + feature 12 drafts** |
| `brain/05-session-lifecycle/0004.session-compression.md` | Still correct scope for **13** handler — open |
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Wrong FTS target (`session_turns` vs `sessions`); `general` session kind — **16** supersedes |

# Ambiguous / conflicting sources

1. **Inline Haiku vs SessionContextCompressor DO:** Build-guide `03-session-lifecycle.md` uses `env.BRAIN.get(compressorId)` + inline `generateObject`. **17** + **12** use ephemeral DO via `subAgent()`. **Prefer 17.**
2. **Summary storage column:** Build-guide `compressionSummary` vs shipped `outcome_summary`. **Prefer shipped schema + 17.**
3. **Summary field schema:** Ledger **0003** vs **17** four-field strings. **Prefer 17.**
4. **Child session type:** Build-guide hardcodes `chat`. **17** copies `oldSession.sessionType`. **Prefer 17** (cooking continuity).
5. **Handler file location:** Ledger **0003** and **0004** both target `compress.session.handler.ts` but **0003** embeds Haiku — split: Haiku in **12** `compress.session.context.handler.ts`, orchestration in **13** `compress.session.handler.ts`. **Prefer split.**
6. **Folder layout:** `01-do-class-and-setup.md` `_context/compress.session.context.handler.ts` vs `_subagents/session-context-compressor/`. **Prefer _subagents** per **12** build manifest.
7. **Brain vs Mira compression:** **17** Brain path vs **24** product Mira compressor (sacred block, tiers). **13 implements 17 only.**
8. **search_session_history and compressed status:** Tool spec filters `completed` — compressed sessions invisible to FTS search until spec extended (**16** G?).
9. **When check runs:** **17** explicitly before new user turn; counters reflect pre-turn state — **20** must not increment before check.
10. **Continuation vs Block 6:** **15** Block 6 = last **completed** session outcome; mid-session compression uses separate **13** continuation block — both coexist.

# Sources

- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/13-gaps-and-missing-specs.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/18-vectorize.md`
- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/00-overview.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md`
- `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md`
- `_records/implementation-ledger/0000-ledger-index.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/12-brain-sub-agents/status.md`
- `_features/10-brain-agent-identity/spec.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `brioela-specs/09-per-user-brain.md`

# Draft count

**8** files in `draft/` — 7 gap snapshots (**13**-owned production targets) + 1 cross-ref note to **12** compressor drafts.
