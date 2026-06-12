# Brain Vectorize — Spec

Feature **17**. Cloudflare Vectorize integration for **semantic session recall** over `sessions.outcome_summary`: Cohere embedding pipeline, 20-shard index routing, fire-and-forget upsert at session close, re-embed on compression, internal semantic query helper, wrangler bindings, and failure logging.

**Not in this feature:** FTS5 keyword search (**16** `search_session_history`); session lifecycle handlers (**11**); compression logic (**13**); system prompt block assembly (**15**); `read_user_memory` namespace reads (**05**); skill deduplication Vectorize path in `brioela-specs/09` (rejected — see conflicts); legacy `backend/src/lib/vector-sync.ts` (Supabase-era, wrong contract); Upstash Workflow retry job implementation (specified, not built); dedicated AI tool for semantic search (no tool in catalog — internal library + **20** orchestration).

---

## Purpose

Users ask meaning-based questions about past sessions that have no reliable keywords: "What did grandma teach me about slow cooking?" FTS5 (**16**) needs matchable terms in `outcome_summary`. Vectorize compares query embedding to stored summary embeddings.

SQLite inside the Brain DO has no vector extension. Semantic search uses Cloudflare Vectorize (Worker-to-Vectorize ~5–20ms per `00-overview.md`).

One vector domain. No scope creep.

---

## What gets embedded — complete inventory

| Entity | Embedded? | Spec authority |
|---|---|---|
| `sessions.outcome_summary` (completed sessions) | **Yes** | `18-vectorize.md`, `00-overview.md` Vector Layer |
| `sessions.outcome_summary` (abandoned — minimal summary) | **Yes** | `18-vectorize.md` Session Abandoned |
| `sessions.outcome_summary` after compression (rewritten summary text) | **Yes** — re-upsert same `sessionId` | `18-vectorize.md` Session Compressed; **13** calls **17** |
| `session_turns.content` | **No** | Turn recall = FTS5 direct read (`08-session-turns.md`) |
| `user_memory` facts | **No** | Namespace-organized; loaded wholesale — `18-vectorize.md`, `00-overview.md` |
| `memory_event` rows | **No** | Event log; not similarity-indexed |
| `skills` name/description | **No** (implementable spec) | `00-overview.md` — full index in every prompt |
| `skills` dedup on create | **No** (implementable spec) | `brioela-specs/09`, `24` propose Vectorize — **conflicts with `18-vectorize.md`** |
| `recipes` | **No** | Titles visible in prompt; volume bounded |
| `constraints`, `user_personality` | **No** | Injected wholesale at session start |

**Vector ID:** `sessionId` (UUID, 36 chars ≤ 64-byte limit).

**Nothing else is indexed** until a future spec explicitly adds a domain.

---

## Embedding model — Cohere `embed-multilingual-v2.0`

| Property | Value |
|---|---|
| Provider | Cohere REST API (`https://api.cohere.ai/v1/embed`) |
| Model | `embed-multilingual-v2.0` |
| Dimensions | **768** |
| Index metric | **cosine** (fixed at index creation) |
| Secret | `COHERE_API_KEY` (wrangler secret) |
| Truncate | `END` (long summaries truncate from end) |

### Why not Workers AI / OpenAI / BGE

| Model | Dims | Rejected because |
|---|---|---|
| `@cf/baai/bge-base-en-v1.5` | 768 | English-biased — Amharic/Arabic summaries fail |
| `text-embedding-3-small` | 1536 | 2× storage; no meaningful gain for summaries |
| `text-embedding-3-large` | 3072 | Exceeds Vectorize 1536-dim cap |

Multilingual is load-bearing for Brioela's user base (Amharic, Arabic, English).

### `input_type` (Cohere retrieval convention)

| Use | `input_type` |
|---|---|
| Stored document (`outcome_summary` at upsert) | `search_document` |
| Query text (semantic search) | `search_query` |

Wrong `input_type` degrades retrieval quality.

---

## Index structure — 20 shards × user namespace

### Shard assignment

```typescript
const SHARD_COUNT = 20   // 20 × 50,000 namespaces = 1,000,000 users

function getShardIndex(userId: string): number {
  let hash = 2166136261   // FNV-1a offset basis (32-bit)
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash % SHARD_COUNT
}
```

| Function | Returns |
|---|---|
| `getIndexName(userId)` | `brioela-sessions-${shard}` |
| `getNamespace(userId)` | `userId` |
| `getVectorIndex(userId, env)` | `env[`SESSIONS_VEC_${shard}`]` |

All 20 indexes created at account setup — not on demand. Identical config: 768 dims, cosine.

### Wrangler bindings

```jsonc
"vectorize": [
  { "binding": "SESSIONS_VEC_0",  "index_name": "brioela-sessions-0"  },
  // ... SESSIONS_VEC_1 through SESSIONS_VEC_18 ...
  { "binding": "SESSIONS_VEC_19", "index_name": "brioela-sessions-19" }
]
```

**Current production:** `backend/wrangler.jsonc` has **no** `vectorize` array and **no** `COHERE_API_KEY` binding documented.

---

## Metadata per vector

```typescript
interface SessionVectorMetadata {
  session_type: string   // 'chat' | 'cooking' | 'alarm' | 'background'
  ended_at:     number   // unix ms — time-window filter
  recipe_id:    string   // UUID or '' — post-retrieval filter only
}
```

### Metadata indexes (create before first upsert)

Run once per shard at account setup:

```bash
wrangler vectorize create-metadata-index brioela-sessions-N \
  --property-name session_type --type string
wrangler vectorize create-metadata-index brioela-sessions-N \
  --property-name ended_at --type number
```

`recipe_id` is stored but **not** metadata-indexed (max 10 indexes; recipe queries rare — filter in Brain after query).

Vectorize does not retroactively index metadata on vectors upserted before index creation.

---

## When embeddings are written

### 1. Session close (primary path)

**Owner:** **11** `closeSession` writes SQLite row synchronously; **17** owns async embed+upsert.

After `outcome_summary`, `ended_at`, `status: 'completed'` committed:

```typescript
ctx.waitUntil(
  embedAndStoreSessionVector({ db, env, userId, sessionId, outcomeSummary, sessionType, recipeId, endedAt })
    .catch(err => logEmbeddingFailed(db, userId, sessionId, err))
)
```

Session close **does not await** embedding. FTS5 still indexes summary via triggers immediately.

### 2. Session compression (**13**)

When `outcome_summary` is rewritten to compression summary JSON/text, **13** calls **17** re-embed and upsert with **same** `sessionId`. Upsert overwrites — no delete.

### 3. Abandoned sessions (**11** / **14**)

Minimal abandonment summary is still embedded — user may ask "when did my session crash?"

### NOT embedded on

- `write_user_memory` — no vector sync
- `log_memory_event` — no vector sync
- Session open — no vector
- Turn append — no vector (turn FTS only)

---

## Dual-write consistency

| Store | Source of truth | Lag |
|---|---|---|
| SQLite `sessions.outcome_summary` | **Authoritative** | Synchronous at close |
| Vectorize vector | Derived index | Async `waitUntil`; may fail |
| FTS5 `sessions_fts*` | Derived from SQLite | Trigger-synced at write |

If embedding fails:
- Session row correct
- FTS5 keyword search works
- Semantic search misses until retry
- Failure logged: `agent_state.key = embedding.failed.{sessionId}`

Future **Upstash Workflow** (Path B, event-based — not Brain maintenance) scans `embedding.failed.*` and retries. Not implemented.

---

## Semantic query — internal API (not an AI tool)

`semanticSearchSessions` is a **library function** under `backend/src/agents/brain/`, not a registered AI tool.

**Why not `search_session_history`:** Tool spec `17-search-session-history.md` line 178 — Vectorize is a **separate path**, not this tool. Feature **16** implements FTS only.

**Callers (intended):**
- **20-brain-chat-runtime** — agent/orchestrator chooses semantic vs FTS vs both
- Optional hybrid merge per `00-overview.md` / `08-session-turns.md`: run FTS (**16** executable) + Vectorize, dedupe by `session_id`, combined rank

### Algorithm

Constants from `18-vectorize.md`:

| Constant | Value |
|---|---|
| `DEFAULT_TOP_K` | 10 |
| `SIMILARITY_THRESHOLD` | 0.65 |
| Max topK with `returnMetadata: 'all'` | 50 (platform limit; we use 10) |

Steps:

1. `embedText(query, 'search_query', env)` → 768-dim vector
2. Build metadata filter: optional `session_type` (`$eq`), optional `sinceTs` → `ended_at` (`$gte`)
3. `getVectorIndex(userId, env).query(queryVector, { topK, namespace: userId, filter, returnMetadata: 'all' })`
4. Filter matches where `score >= 0.65`
5. Fetch session rows from SQLite by matched IDs (`inArray`)
6. Re-order by **Vectorize similarity score** (not `ended_at` — unlike FTS path)
7. Post-filter `recipe_id` in application code if caller requests recipe-scoped search

### Return shape (internal)

```typescript
type SemanticSessionHit = {
  id: string
  session_type: string
  outcome_summary: string
  recipe_id: string | null
  ended_at: number
  similarity_score: number
}
```

Empty below threshold → `[]` (not an error).

---

## Updating / deleting vectors

| Event | Action |
|---|---|
| Compression rewrites summary | Re-embed + upsert same ID |
| Session completed | Initial upsert |
| Session abandoned | Upsert minimal summary |
| Vector delete on session row delete | **Not specified** — sessions are not hard-deleted in normal flow; if added later, call `deleteByIds([sessionId])` |

---

## Migration / backfill strategy

**Not fully specified.** Implied requirements:

1. Account setup: create 20 indexes + metadata indexes (checklist in build.md)
2. Existing users with completed sessions but no vectors: one-time backfill job must:
   - Scan `sessions` where `status IN ('completed', 'abandoned')` AND `outcome_summary IS NOT NULL`
   - Skip rows with successful vector (no marker today — gap)
   - Batch embed via Cohere (rate limits — gap)
   - Upsert with historical `ended_at`, `session_type`, `recipe_id` metadata
3. Failed rows: same `embedding.failed.{sessionId}` pattern

No backfill spec file exists — tracked as **G12** in `status.md`.

---

## Cost / rate limits

| Source | Note |
|---|---|
| `18-vectorize.md` Limits Summary | Workers Paid Vectorize limits documented (dims, namespaces, vectors/index, topK, batch upsert 1000) |
| Cohere API | Per-request billing; one embed per session close + one per query — no batching spec for close path |
| Embed at close | One Cohere call per completed/abandoned session |
| Query | One Cohere call per semantic search invocation |

No explicit Cohere rate-limit handling in specs — implement retry with backoff on 429 (**G13**).

---

## Feature boundaries

| Feature | Scope | Relation to **17** |
|---|---|---|
| **05** | `read_user_memory` namespace reads | Tool spec mentions "FTS5 and Vectorize" for memory search — **`18-vectorize.md` rejects memory embedding**. **05** does not call **17**. Namespace load only. |
| **11** | `closeSession`, abandoned summary | Calls **17** `waitUntil` embed hook after SQLite commit |
| **13** | Compression summary write | Calls **17** re-embed after compress |
| **15** | `buildSystemPrompt` | Optional future Block: "Vectorize session recall snippets" — **not in current builder** (`15` spec line 416) |
| **16** | `search_session_history` FTS tool | **FTS only**. Semantic = **17** internal API. Hybrid merge = **20** |
| **20** | Chat turn loop | Chooses when to call `semanticSearchSessions` vs FTS tool |

### `search_session_history` vs semantic — explicit split

| Path | Feature | Mechanism | Ordering |
|---|---|---|---|
| Keyword / phrase | **16** | `sessions_fts` / `sessions_fts_trigram` | `ended_at DESC` after join |
| Meaning / intent | **17** | Cohere query embed + Vectorize cosine | Similarity score DESC |
| Hybrid | **20** (orchestration) | Both + dedupe | Combined rank — algorithm not specced |

`build-guide/06-brain-memory/03-vectorize.md` title says "semantic query path in search_session_history" — **superseded** by tool spec **17** line 178 + feature **16** boundary.

### `read_user_memory` vs Vectorize

`03-read-user-memory.md` line 26: "Searching memory by meaning — FTS5 and Vectorize handle search, not this tool."

**Conflict:** No `user_memory` Vectorize domain in `18-vectorize.md`. Treat memory semantic search as **unscoped / stale** until a new spec adds a domain. **17** does not implement it.

---

## Cloudflare Vectorize platform notes (current API)

From [Cloudflare Vectorize client API](https://developers.cloudflare.com/vectorize/reference/client-api/) and [metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/):

- **Wrangler ≥ 3.71.0** for Vectorize V2
- Bindings expose `Vectorize` class: `upsert`, `query`, `deleteByIds`, `getByIds`, `queryById`
- `query(vector, { topK, namespace, filter, returnMetadata: 'all' | 'indexed' | 'none' })`
- Metadata filters: `$eq`, `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$in`, `$nin` on indexed properties
- Namespace filtering built-in; operations scoped per-namespace
- Metadata indexes must exist **before** upsert for filter to apply to those properties
- Vectors upserted before metadata index creation won't have that property indexed until re-upserted
- Max **10 metadata indexes** per Vectorize index
- Legacy V1 deprecated; use V2 bindings (`Vectorize`, not `VectorizeIndex` beta) — `worker-configuration.d.ts` includes both

Brioela spec uses `VectorizeIndex` type name in pseudocode; production should use current `Vectorize` binding type from wrangler-generated `Env`.

---

## Obsolete / conflicting production artifacts

| Artifact | Issue |
|---|---|
| `backend/src/lib/vector-sync.ts` | Supabase-era generic sync; no `namespace`; `table` in metadata; not Brain session contract — **do not use for 17** |
| `shared/api/stress-test.routes.ts` `vector-search`, `migrate-vectors` | Legacy stress routes; no Brain DO integration |
| `brioela-specs/09-per-user-brain.md` skill dedup Vectorize | Conflicts with single-domain `18-vectorize.md` |
| `00-overview.md` line 60 example `brioela-memory-00` | Naming example wrong; canonical name `brioela-sessions-{shard}` |
| `brioela-tools/00-index.md` line 54 "keyword or meaning" | Meaning = **17**, not **16** tool implementation |

---

## Acceptance (feature fully done when)

- [ ] 20 Vectorize indexes + metadata indexes exist in Cloudflare account
- [ ] `wrangler.jsonc` has `SESSIONS_VEC_0`–`19` bindings + `COHERE_API_KEY` secret
- [ ] `embedText`, shard helpers, `embedAndStoreSessionVector`, `semanticSearchSessions` implemented under `backend/src/agents/brain/`
- [ ] **11** `closeSession` calls embed hook via `waitUntil`
- [ ] **13** compression path calls re-embed hook
- [ ] Failures write `agent_state` `embedding.failed.{sessionId}`
- [ ] Tests: shard routing deterministic, upsert mock, semantic query threshold, user namespace isolation
- [ ] **16** FTS tool remains free of Vectorize imports
- [ ] Legacy `vector-sync.ts` not wired into Brain path (or removed in separate cleanup)

---

## Sources

- `implementable-specs/18-vectorize.md` (**PRIMARY**)
- `implementable-specs/00-overview.md` (Vector Layer, hybrid search)
- `implementable-specs/07-sessions.md` (`outcome_summary`, FTS)
- `implementable-specs/08-session-turns.md` (hybrid merge note; turn FTS not vectorized)
- `implementable-specs/11-agent-state.md` (failure key pattern)
- `implementable-specs/13-gaps-and-missing-specs.md` item 9 (closed → 18-vectorize)
- `implementable-specs/brioela-tools/03-read-user-memory.md` (memory search mention — conflict)
- `implementable-specs/brioela-tools/17-search-session-history.md` (FTS tool; line 178 semantic separate)
- `implementable-specs/brioela-tools/00-index.md` (line 54 naming)
- `build-guide/06-brain-memory/03-vectorize.md`
- `build-guide/06-brain-memory/00-overview.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/13-brain-session-compression/spec.md`
- `_features/15-brain-system-prompt/spec.md`
- `_features/16-brain-session-tools/spec.md`
- `_records/connections/06-brain-memory-connections.md`
- `brioela-specs/09-per-user-brain.md` (skill dedup — conflict)
- `brioela-specs/24-technical-architecture-backbone.md` (skill dedup — conflict)
- `backend/wrangler.jsonc` (no bindings today)
- `backend/src/lib/vector-sync.ts` (legacy)
- [Cloudflare Vectorize client API](https://developers.cloudflare.com/vectorize/reference/client-api/)
- [Cloudflare metadata filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/)
- [Wrangler vectorize commands](https://developers.cloudflare.com/vectorize/reference/wrangler-commands/)
