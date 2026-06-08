# Spec: Vectorize — Semantic Session Search

## Why This Spec Exists

FTS5 (`search_session_history`) handles keyword search — the user says "doro wat" and we find sessions where those words appear in `outcome_summary`. That covers most cases.

But some queries have no keyword to match. "What did grandma teach me about slow cooking?" has no session that literally contains those words. The user is asking by meaning. That requires vector similarity search — comparing the meaning of the query against the meaning of stored session summaries.

Cloudflare Vectorize is the vector store. This spec defines: the embedding model, the index structure, the sharding strategy, when embeddings are created, how queries run, and what happens when things fail.

---

## What Gets Vectorized — Only One Thing

`sessions.outcome_summary` — the agent-written summary at the end of every completed session.

Nothing else. Not `user_memory` facts, not skill content, not recipe content. Reasons:

- `user_memory` is already organized by namespace — the agent loads it wholesale by namespace, not by similarity search
- Skills are tiny index entries — the agent reads all of them in every prompt
- Recipes are tens to low hundreds — the agent sees all titles in every prompt
- Sessions are potentially thousands — and their summaries are the thing users actually ask about ("what did we cook", "when did I last feel sick", "what happened in that grandma session")

One domain. One index family. No scope creep.

---

## Embedding Model — Cohere embed-multilingual-v2.0

**Model**: `embed-multilingual-v2.0` (Cohere)
**Dimensions**: 768
**Distance metric**: cosine (fixed at index creation — cannot be changed later)

Why Cohere multilingual and not the alternatives:

| Model | Dims | Why rejected |
|---|---|---|
| `@cf/baai/bge-base-en-v1.5` | 768 | English-biased — Brioela serves Amharic and Arabic speakers. Semantic search over non-English outcome_summary would produce garbage results |
| `text-embedding-3-small` | 1536 | Good multilingual, but 1536 dims = double the storage/query cost vs 768. No meaningful quality gain for this use case |
| `text-embedding-3-large` | 3072 | Exceeds Vectorize hard cap of 1536 dims. Cannot be used |

Brioela's core user base speaks Amharic, Arabic, and English. A grandmother's cooking session `outcome_summary` may contain Amharic words. A query about it may also be in Amharic. An English-biased embedding model cannot match these semantically. Multilingual is not optional — it is load-bearing.

768 dimensions fits well within the 1536 hard cap and halves dimension volume cost compared to 1536-dim models. Cohere's multilingual model is well-established for production use.

**Embedding API call** (made from the Brain DO at session close):

```typescript
const response = await fetch('https://api.cohere.ai/v1/embed', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.COHERE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texts:           [session.outcome_summary],
    model:           'embed-multilingual-v2.0',
    input_type:      'search_document',   // 'search_document' for stored vectors
    truncate:        'END',               // truncate long summaries from end, not beginning
  }),
})
const { embeddings } = await response.json()
const vector: number[] = embeddings[0]   // 768-dimensional float array
```

For queries (when `search_session_history` uses semantic path):

```typescript
// input_type changes to 'search_query' for query-time embeddings
body: JSON.stringify({
  texts:      [userQuery],
  model:      'embed-multilingual-v2.0',
  input_type: 'search_query',
})
```

Cohere distinguishes `search_document` (stored) from `search_query` (retrieval) — using the right `input_type` improves retrieval quality.

---

## Index Structure — Sharding by userId

### Why Sharding Is Needed

Vectorize supports 50,000 namespaces per index (paid plan). Each user gets one namespace. One index supports 50,000 users. Beyond that: multiple indexes.

Rather than creating indexes on demand (operational complexity), pre-shard across a fixed number of indexes at account setup time.

### Shard Calculation

```typescript
const SHARD_COUNT = 20   // 20 indexes × 50,000 namespaces = 1,000,000 users

function getShardIndex(userId: string): number {
  // FNV-1a hash — fast, good distribution, no external dependency
  let hash = 2166136261   // FNV offset basis (32-bit)
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i)
    hash = (hash * 16777619) >>> 0   // FNV prime, keep 32-bit unsigned
  }
  return hash % SHARD_COUNT
}

function getIndexName(userId: string): string {
  return `brioela-sessions-${getShardIndex(userId)}`
}

function getNamespace(userId: string): string {
  return userId   // namespace IS the userId within the shard
}
```

### Index Names

```
brioela-sessions-0
brioela-sessions-1
...
brioela-sessions-19
```

All 20 indexes created at account setup — not on demand. All have identical configuration: 768 dims, cosine distance, same metadata indexes.

### Wrangler Configuration

```toml
# wrangler.toml — one binding per shard
[[vectorize]]
binding = "SESSIONS_VEC_0"
index_name = "brioela-sessions-0"

[[vectorize]]
binding = "SESSIONS_VEC_1"
index_name = "brioela-sessions-1"

# ... repeat for all 20 shards

[[vectorize]]
binding = "SESSIONS_VEC_19"
index_name = "brioela-sessions-19"
```

Accessing the correct index at runtime:

```typescript
function getVectorIndex(userId: string, env: Env): VectorizeIndex {
  const shard = getShardIndex(userId)
  const key = `SESSIONS_VEC_${shard}` as keyof Env
  return env[key] as VectorizeIndex
}
```

---

## Metadata Indexes — Created Before First Upsert

Vectorize does not retroactively index metadata. Metadata indexes must exist before vectors are upserted. Create these on all 20 indexes at account setup:

```bash
# Run once per shard at account setup
wrangler vectorize create-metadata-index brioela-sessions-0 \
  --property-name session_type --type string

wrangler vectorize create-metadata-index brioela-sessions-0 \
  --property-name ended_at --type number

# Repeat for shards 1–19
```

### Metadata Stored Per Vector

```typescript
interface SessionVectorMetadata {
  session_type: string    // 'chat' | 'cooking' | 'alarm' | 'background'
  ended_at:     number    // unix timestamp ms — for time-window filtering
  recipe_id:    string    // UUID or '' — for recipe-specific session queries
}
```

`recipe_id` is stored as metadata but NOT given a metadata index (max 10 indexes, and recipe_id queries are rare). Recipe filtering is done post-retrieval in the Brain — check the returned metadata, filter out non-matching recipe_ids. Only `session_type` and `ended_at` get metadata indexes for fast filtered search.

---

## When Embeddings Are Created

At session close, after `outcome_summary` is written to the `sessions` row. This is fire-and-forget — the session close does not wait for the embedding to complete.

```typescript
async function closeSessionWithEmbedding(
  sessionId: string,
  outcomeSummary: string,
  sessionType: string,
  recipeId: string | null,
) {
  const now = Date.now()

  // Step 1: Write session row — synchronous, blocking
  db.update(sessions).set({
    status:         'completed',
    outcomeSummary: outcomeSummary,
    endedAt:        now,
    endReason:      'completed',
  }).where(eq(sessions.id, sessionId)).run()

  // Step 2: Create + store embedding — fire and forget
  ctx.waitUntil(
    createAndStoreEmbedding(sessionId, outcomeSummary, sessionType, recipeId, now)
      .catch(err => {
        // Log failure — do not crash session close
        db.insert(agentState).values({
          key:       `embedding.failed.${sessionId}`,
          userId:    ctx.userId,
          value:     JSON.stringify({ error: err.message, summary_length: outcomeSummary.length }),
          updatedAt: Date.now(),
        }).run()
      })
  )
}

async function createAndStoreEmbedding(
  sessionId:     string,
  summary:       string,
  sessionType:   string,
  recipeId:      string | null,
  endedAt:       number,
) {
  // Embed
  const vector = await embedText(summary, 'search_document')

  // Upsert into correct shard
  const index = getVectorIndex(ctx.userId, env)
  await index.upsert([{
    id:        sessionId,              // session UUID — max 64 bytes, UUID is 36 chars ✓
    values:    vector,                 // 768-dimensional float array
    namespace: ctx.userId,            // userId as namespace within the shard
    metadata: {
      session_type: sessionType,
      ended_at:     endedAt,
      recipe_id:    recipeId ?? '',
    },
  }])
}
```

### Failure Handling

Failed embeddings are logged to `agent_state` with key `embedding.failed.{sessionId}`. A future Upstash Workflow background job (not the Curator — this is event-based, Path B) scans for failed embeddings and retries them. The session row itself is already written correctly — only the vector is missing. The FTS5 keyword search still works for that session; only semantic search misses it until retried.

---

## Querying — Semantic Path in search_session_history

`search_session_history` (tool 17) has two search paths:

1. **FTS5 keyword path** (existing) — for queries with clear keywords
2. **Vectorize semantic path** (this spec) — for meaning-based queries

The agent decides which path to use based on query nature. A query like "what did grandma teach me about slow cooking" has no reliable keywords — semantic path. A query like "doro wat spice order" has clear keywords — FTS5 path. The agent can also run both and merge results.

### Semantic Query Implementation

```typescript
async function semanticSearchSessions(
  query:        string,
  sessionType?: string,
  sinceTs?:     number,
  topK:         number = 10,
): Promise<SessionSearchResult[]> {

  // 1. Embed the query — use 'search_query' input_type (different from stored documents)
  const queryVector = await embedText(query, 'search_query')

  // 2. Build metadata filter
  const filter: VectorizeVectorMetadataFilter = {}
  if (sessionType) {
    filter.session_type = { $eq: sessionType }
  }
  if (sinceTs) {
    filter.ended_at = { $gte: sinceTs }
  }

  // 3. Query the correct shard, scoped to this user's namespace
  const index = getVectorIndex(ctx.userId, env)
  const results = await index.query(queryVector, {
    topK:           topK,
    namespace:      ctx.userId,
    filter:         Object.keys(filter).length > 0 ? filter : undefined,
    returnMetadata: 'all',
  })

  // 4. Fetch full session rows for matched IDs
  const sessionIds = results.matches.map(m => m.id)
  if (sessionIds.length === 0) return []

  const sessionRows = db.select({
    id:             sessions.id,
    sessionType:    sessions.sessionType,
    outcomeSummary: sessions.outcomeSummary,
    recipeId:       sessions.recipeId,
    endedAt:        sessions.endedAt,
  })
  .from(sessions)
  .where(inArray(sessions.id, sessionIds))
  .all()

  // 5. Re-order by Vectorize score (similarity), not by endedAt
  // For semantic search, similarity rank matters more than recency
  return results.matches
    .map(match => ({
      score:   match.score,
      session: sessionRows.find(s => s.id === match.id),
    }))
    .filter(r => r.session)
    .map(r => ({ ...r.session!, similarity_score: r.score }))
}
```

**topK cap**: Vectorize returns max 50 results when `returnMetadata: 'all'` is requested. We request topK=10 — well within this limit.

**Score threshold**: do not return results below similarity score 0.65. Below that threshold, the match is not semantically meaningful — better to return nothing than a false match.

```typescript
const SIMILARITY_THRESHOLD = 0.65
const filtered = results.matches.filter(m => m.score >= SIMILARITY_THRESHOLD)
```

---

## Updating / Deleting Vectors

### Session Compressed

When a session is marked `compressed`, its `outcome_summary` may be rewritten. The vector must be updated:

```typescript
// After compression: re-embed the compression summary and upsert with same session ID
await index.upsert([{
  id:        oldSessionId,
  values:    await embedText(compressionSummary, 'search_document'),
  namespace: ctx.userId,
  metadata:  { session_type, ended_at, recipe_id: recipe_id ?? '' },
}])
```

`upsert` overwrites by ID — no delete needed.

### Session Abandoned

Abandoned sessions get a minimal `outcome_summary` ("Session ended unexpectedly..."). This is still embedded and stored — it is part of the user's history. A user might ask "when did my last session crash?" and the semantic search should surface it.

---

## Index Setup Checklist (Run Once at Account Setup)

```bash
# Create all 20 indexes
for i in $(seq 0 19); do
  wrangler vectorize create brioela-sessions-$i \
    --dimensions=768 \
    --metric=cosine
done

# Create metadata indexes on all 20 shards
for i in $(seq 0 19); do
  wrangler vectorize create-metadata-index brioela-sessions-$i \
    --property-name session_type --type string

  wrangler vectorize create-metadata-index brioela-sessions-$i \
    --property-name ended_at --type number
done
```

This is a one-time operation. The metadata indexes must exist before any vectors are upserted.

---

## Limits Summary (Workers Paid)

| Limit | Value | Our usage |
|---|---|---|
| Max dimensions | 1536 | 768 ✓ |
| Max namespaces per index | 50,000 | 1 per user ✓ |
| Max vectors per index | 10,000,000 | ~1000 sessions/user × 50k users = 50M across 20 shards → ~2.5M per shard ✓ |
| topK with metadata | 50 | We use topK=10 ✓ |
| Max vector ID length | 64 bytes | UUID = 36 chars ✓ |
| Max namespace name length | 64 bytes | userId = UUID = 36 chars ✓ |
| Upsert batch size (binding) | 1,000 | We upsert 1 at a time ✓ |
