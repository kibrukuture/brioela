# Status

open

**Vectorize not shipped.** No Cohere embed pipeline, no wrangler Vectorize bindings, no Brain embed/search code. Legacy `backend/src/lib/vector-sync.ts` (Supabase-era) exists but is not the Brioela session contract.

# Shipped in backend (partial — data spine only)

- [x] `sessions.outcome_summary` column — schema (**04** / **11**)
- [x] FTS5 on `outcome_summary` via triggers — **04** migration `0001` (keyword path for **16**)
- [ ] Cloudflare indexes `brioela-sessions-0` … `brioela-sessions-19`
- [ ] Metadata indexes `session_type`, `ended_at` on all shards
- [ ] `wrangler.jsonc` `SESSIONS_VEC_*` bindings (20)
- [ ] `COHERE_API_KEY` secret
- [ ] `embed.text.helper.ts`
- [ ] `get.shard.index.helper.ts` + `get.vector.index.helper.ts`
- [ ] `embed.and.store.session.executable.ts`
- [ ] `semantic.search.sessions.repository.ts`
- [ ] `close.session.embedding.hook.ts` wired from **11**
- [ ] `reembed.session.on.compress.executable.ts` wired from **13**
- [ ] `log.embedding.failed.repository.ts`
- [ ] Vectorize tests
- [ ] Upstash Workflow embedding retry job

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No Cohere `embedText` helper | `rg embedText backend/src/agents/brain` — zero |
| G2 | No FNV-1a shard routing | `rg getShardIndex backend` — zero |
| G3 | No `getVectorIndex` env resolver | `rg SESSIONS_VEC backend` — zero |
| G4 | No `embedAndStoreSessionVector` | No upsert to Vectorize in Brain |
| G5 | No `semanticSearchSessions` | No query path in Brain |
| G6 | `wrangler.jsonc` missing vectorize bindings | File has DO only — no `vectorize` array |
| G7 | No `COHERE_API_KEY` in worker secrets/docs | Not in wrangler |
| G8 | Vectorize indexes not provisioned | Account setup checklist not run |
| G9 | **11** close does not schedule embed | `close.session.handler.ts` missing (**11** G2) |
| G10 | **13** re-embed on compress not wired | **13** G16 |
| G11 | No `embedding.failed.{sessionId}` writer | `agent_state` pattern in spec only |
| G12 | No backfill strategy for existing sessions | Spec gap — no implementable backfill doc |
| G13 | No Cohere 429 / rate-limit retry policy | Spec silent |
| G14 | Upstash Workflow retry job not built | `18-vectorize.md` — future Path B |
| G15 | Hybrid FTS+Vectorize merge algorithm undefined | `00-overview.md`, `08-session-turns.md` mention merge; no scoring spec |
| G16 | No AI tool for semantic search | By design — internal API; **20** must orchestrate |
| G17 | Legacy `vector-sync.ts` wrong contract | No namespace; Supabase comment; not imported by Brain |
| G18 | Stress-test vector routes orphaned | `shared/api/stress-test.routes.ts` — no Brain integration |
| G19 | **16** must stay Vectorize-free | Tool spec line 178 — enforce at implementation |
| G20 | Env types missing `SESSIONS_VEC_*` | Generated Env has Vectorize types but no project bindings |

# 17 vs neighbor boundaries

| In **17** (this feature) | In separate feature |
|---|---|
| Cohere embed pipeline | Session row write — **11** |
| 20-shard index routing + wrangler bindings | FTS5 keyword search — **16** |
| Upsert at close (`waitUntil`) | `closeSession` handler body — **11** calls **17** hook |
| Re-embed on compress | Compression summary write — **13** calls **17** |
| `semanticSearchSessions` internal API | `search_session_history` FTS tool — **16** |
| `agent_state` failure keys | Workflow retry consumer — future infra |
| Account setup checklist | — |
| Optional hybrid merge caller | Orchestration — **20** |
| Future prompt snippets from semantic hits | `buildSystemPrompt` — **15** (not built) |
| `read_user_memory` | **05** — no Vectorize path per `18-vectorize.md` |
| Skill dedup Vectorize | **Rejected** — `brioela-specs/09` conflicts with `18-vectorize.md` |

# What gets embedded (inventory)

**Only** `sessions.outcome_summary` text:

- Completed sessions at close
- Abandoned sessions (minimal summary)
- Re-written summary after compression (**13**)

**Not embedded:** `user_memory`, `memory_event`, `session_turns`, `skills`, `recipes`, constraints, personality.

# Blocked by

- 11-brain-sessions-lifecycle (`closeSession` hook surface)
- 13-brain-session-compression (re-embed hook — optional for core **17**)

# Blocks

- 20-brain-chat-runtime (semantic recall orchestration)
- 15-brain-system-prompt (optional future Vectorize snippet block)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `backend/src/lib/vector-sync.ts` | Legacy Supabase sync; no user namespace; not Brain session metadata shape |
| `brioela-specs/09-per-user-brain.md` skill dedup Vectorize | Conflicts with single-domain `18-vectorize.md` — **prefer implementable spec** |
| `brioela-specs/24-technical-architecture-backbone.md` skill Vectorize | Same conflict |
| `build-guide/06-brain-memory/03-vectorize.md` | Says semantic path "in search_session_history" — **superseded** by tool spec **17** line 178 |
| `implementable-specs/brioela-tools/03-read-user-memory.md` | Implies Vectorize for memory search — **no memory domain in 18-vectorize** |
| `brioela-tools/00-index.md` line 54 | "keyword or meaning" on FTS tool — meaning is **17**, not **16** |
| `00-overview.md` line 60 | Example index name `brioela-memory-00` — wrong; use `brioela-sessions-{n}` |
| `_features/05-brain-memory-tools/spec.md` G3 → feature 17 | Typo — `loadMemoryForPrompt` belongs to **15**, not **17** |

# Ambiguous / conflicting sources

1. **Semantic inside search tool:** `18-vectorize.md` + `03-vectorize.md` describe semantic path in `search_session_history`; **`17-search-session-history.md` line 178** says separate. **16 = FTS only; 17 = internal semantic API.**
2. **Memory Vectorize:** `read_user_memory` tool mentions Vectorize for memory; **`18-vectorize.md` excludes user_memory.** No memory embeddings until new spec.
3. **Skill dedup Vectorize:** Product backbone docs vs implementable single-domain spec. **Ship sessions-only per 18-vectorize.**
4. **Hybrid merge ranking:** Overview says merge FTS + Vectorize; no combined score formula. **G15** — **20** must define or defer.
5. **Compressed session semantic search:** **16** excludes `compressed` from FTS (`completed` filter). Compressed rows have JSON `outcome_summary` — if re-embedded with compression text, semantic path may still find them via Vectorize while FTS tool cannot — document asymmetry.
6. **Workers AI embeddings:** Platform offers `@cf/baai/bge-base-en-v1.5` etc.; spec mandates external Cohere for multilingual. **Do not substitute Workers AI without spec change.**

# Cloudflare Vectorize API notes (web/docs)

- Wrangler **≥ 3.71.0** for Vectorize V2
- `env.INDEX.upsert([{ id, values, namespace?, metadata? }])`
- `env.INDEX.query(vector, { topK, namespace, filter, returnMetadata: 'all' })`
- Metadata filters on indexed properties only; re-upsert required if index added after vector insert
- Max 10 metadata indexes per index; namespace isolation native
- See [client API](https://developers.cloudflare.com/vectorize/reference/client-api/), [metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)

# Sources

- `implementable-specs/18-vectorize.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `implementable-specs/11-agent-state.md`
- `implementable-specs/13-gaps-and-missing-specs.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `implementable-specs/brioela-tools/00-index.md`
- `build-guide/06-brain-memory/03-vectorize.md`
- `build-guide/06-brain-memory/00-overview.md`
- `brioela-specs/09-per-user-brain.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `_records/connections/06-brain-memory-connections.md`
- `_records/inventory/inventory.md`
- `_records/build-order/04-layer-brain-memory.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/13-brain-session-compression/spec.md`
- `_features/13-brain-session-compression/status.md`
- `_features/15-brain-system-prompt/spec.md`
- `_features/16-brain-session-tools/spec.md`
- `_features/16-brain-session-tools/status.md`
- `_features/05-brain-memory-tools/spec.md`
- `backend/wrangler.jsonc`
- `backend/src/lib/vector-sync.ts`
- `backend/worker-configuration.d.ts` (Vectorize types)
- `shared/api/stress-test.routes.ts`

# Draft count

**11** files in `draft/` — full intended production snapshots for helpers, executables, repositories, hook, env bindings, and tests.
