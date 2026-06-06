# Memory Engine — Vectorize Semantic Search

## What This File Covers

Cloudflare Vectorize setup, embedding model choice, 20-shard index structure, when embeddings are created, the semantic query path in `search_session_history`, update/delete behavior, and the one-time account setup checklist.

---

## What Gets Vectorized — One Thing Only

`sessions.outcome_summary` — the agent-written summary at the end of every completed session.

Nothing else. Not `user_memory`, not skill content, not recipes. Why:

- `user_memory` is namespace-organized — loaded wholesale by namespace, not by similarity
- Skills are a tiny index — the agent reads all of them in every prompt
- Recipes are at most hundreds — all titles visible in every prompt
- Sessions scale to thousands — and summaries are what users ask about ("what did we cook", "when did I last feel sick")

FTS5 handles keyword search (`search_session_history` uses it). Vectorize handles meaning-based search. They are complementary, not competing.

---

## Embedding Model — Cohere `embed-multilingual-v2.0`

**Dimensions:** 768  
**Distance metric:** cosine (fixed at index creation — cannot be changed)

| Option | Dims | Why rejected |
|---|---|---|
| `@cf/baai/bge-base-en-v1.5` | 768 | English-biased. Amharic + Arabic outcome summaries get garbage results. |
| `text-embedding-3-small` | 1536 | Good multilingual but 2× storage cost with no meaningful quality gain for this use case. |
| `text-embedding-3-large` | 3072 | Exceeds Vectorize hard cap of 1536 dims. Cannot be used. |

Brioela's core user base speaks Amharic, Arabic, and English. A grandmother's cooking session summary may contain Amharic words. A query about it may be in Amharic. English-biased embedding cannot match these semantically. Multilingual is load-bearing, not optional.

```typescript
// For stored documents (at session close)
async function embedText(
  text: string,
  inputType: 'search_document' | 'search_query',
  env: Env,
): Promise<number[]> {
  const response = await fetch('https://api.cohere.ai/v1/embed', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.COHERE_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      texts:      [text],
      model:      'embed-multilingual-v2.0',
      input_type: inputType,   // 'search_document' for storage, 'search_query' for retrieval
      truncate:   'END',
    }),
  })
  const { embeddings } = await response.json() as { embeddings: number[][] }
  return embeddings[0]!
}
```

Cohere requires different `input_type` for stored vs queried text — using the wrong type degrades retrieval quality.

---

## 20-Shard Index Structure

### Why Sharding

Vectorize supports 50,000 namespaces per index. Each user occupies one namespace. 1,000,000 users → 20 indexes × 50,000 namespaces each.

Pre-shard at account setup — do not create indexes on demand.

### Shard Assignment

```typescript
const SHARD_COUNT = 20

function getShardIndex(userId: string): number {
  // FNV-1a hash — fast, good distribution, no external dependency
  let hash = 2166136261
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash % SHARD_COUNT
}

function getIndexName(userId: string): string {
  return `brioela-sessions-${getShardIndex(userId)}`
}

function getVectorIndex(userId: string, env: Env): VectorizeIndex {
  const key = `SESSIONS_VEC_${getShardIndex(userId)}` as keyof Env
  return env[key] as VectorizeIndex
}
```

### Index Names

```
brioela-sessions-0  through  brioela-sessions-19
```

All 20 created at account setup. All identical configuration: 768 dims, cosine distance.

### `wrangler.jsonc` Bindings

```jsonc
"vectorize": [
  { "binding": "SESSIONS_VEC_0",  "index_name": "brioela-sessions-0"  },
  { "binding": "SESSIONS_VEC_1",  "index_name": "brioela-sessions-1"  },
  // ... repeat for 2–18
  { "binding": "SESSIONS_VEC_19", "index_name": "brioela-sessions-19" }
]
```

---

## Metadata Per Vector

```typescript
interface SessionVectorMetadata {
  session_type: string   // 'chat' | 'cooking' | 'alarm' | 'background'
  ended_at:     number   // unix ms — for time-window filtering
  recipe_id:    string   // recipe UUID or '' — post-retrieval filtering only
}
```

`session_type` and `ended_at` get metadata indexes (fast filtered search). `recipe_id` does not — recipe-specific queries are post-retrieval filtered.

---

## When Embeddings Are Created — Fire and Forget

At session close, after `outcome_summary` is written. The session row is committed first (synchronous). The embedding is created asynchronously via `ctx.waitUntil()`. Session close does not wait for the embedding.

```typescript
async function closeSessionWithEmbedding(
  db: DrizzleDB,
  ctx: DurableObjectState,
  env: Env,
  sessionId: string,
  userId: string,
  outcomeSummary: string,
  sessionType: string,
  recipeId: string | null,
): Promise<void> {
  const now = Date.now()

  // Step 1 — write session row, synchronous
  db.update(sessions).set({
    status:         'completed',
    outcomeSummary,
    endedAt:        now,
    endReason:      'completed',
  }).where(eq(sessions.id, sessionId)).run()

  // Step 2 — embed and store, fire and forget
  ctx.waitUntil(
    embedAndStore(db, env, sessionId, userId, outcomeSummary, sessionType, recipeId, now)
      .catch(err => {
        db.insert(agentState).values({
          key:       `embedding.failed.${sessionId}`,
          userId,
          value:     JSON.stringify({ error: String(err), ts: Date.now() }),
          updatedAt: Date.now(),
        }).run()
      })
  )
}

async function embedAndStore(
  db: DrizzleDB,
  env: Env,
  sessionId: string,
  userId: string,
  summary: string,
  sessionType: string,
  recipeId: string | null,
  endedAt: number,
): Promise<void> {
  const vector = await embedText(summary, 'search_document', env)
  const index  = getVectorIndex(userId, env)

  await index.upsert([{
    id:        sessionId,
    values:    vector,
    namespace: userId,
    metadata: {
      session_type: sessionType,
      ended_at:     endedAt,
      recipe_id:    recipeId ?? '',
    },
  }])
}
```

**Failed embeddings:** logged to `agent_state` with key `embedding.failed.{sessionId}`. A background Upstash Workflow job (separate from the Curator) scans for failed embeddings and retries them. FTS5 keyword search still works for sessions with missing vectors — only semantic search misses them until retried.

---

## Semantic Query — `search_session_history` Tool (Semantic Path)

```typescript
const SIMILARITY_THRESHOLD = 0.65
const DEFAULT_TOP_K         = 10

async function semanticSearchSessions(
  db:           DrizzleDB,
  env:          Env,
  userId:       string,
  query:        string,
  sessionType?: string,
  sinceTs?:     number,
): Promise<SessionSearchResult[]> {

  // Embed the query — input_type 'search_query' (different from stored documents)
  const queryVector = await embedText(query, 'search_query', env)

  // Build metadata filter
  const filter: VectorizeVectorMetadataFilter = {}
  if (sessionType) filter.session_type = { $eq: sessionType }
  if (sinceTs)     filter.ended_at     = { $gte: sinceTs }

  // Query correct shard, scoped to this user's namespace
  const index   = getVectorIndex(userId, env)
  const results = await index.query(queryVector, {
    topK:           DEFAULT_TOP_K,
    namespace:      userId,
    filter:         Object.keys(filter).length > 0 ? filter : undefined,
    returnMetadata: 'all',
  })

  // Apply similarity threshold — do not return weak matches
  const matched = results.matches.filter(m => m.score >= SIMILARITY_THRESHOLD)
  if (matched.length === 0) return []

  // Fetch full session rows for matched IDs
  const sessionIds = matched.map(m => m.id)
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

  // Re-order by Vectorize similarity score (not recency)
  return matched
    .map(match => ({
      score:   match.score,
      session: sessionRows.find(s => s.id === match.id),
    }))
    .filter((r): r is { score: number; session: NonNullable<typeof r.session> } => !!r.session)
    .map(r => ({ ...r.session, similarityScore: r.score }))
}
```

---

## Updating Vectors

**Session compressed:** `outcome_summary` may change. Re-embed and upsert with same session ID:

```typescript
await index.upsert([{
  id:        sessionId,   // same ID — upsert overwrites by ID
  values:    await embedText(compressionSummary, 'search_document', env),
  namespace: userId,
  metadata:  { session_type, ended_at, recipe_id: recipeId ?? '' },
}])
```

**Session abandoned:** minimal `outcome_summary` is still embedded and stored. A user may ask "when did my last session crash?" — semantic search should surface it.

---

## Account Setup Checklist — Run Once

```bash
# Create all 20 indexes
for i in $(seq 0 19); do
  wrangler vectorize create brioela-sessions-$i \
    --dimensions=768 \
    --metric=cosine
done

# Create metadata indexes on all 20 shards
# These MUST exist before any vectors are upserted — Vectorize does not retroactively index metadata
for i in $(seq 0 19); do
  wrangler vectorize create-metadata-index brioela-sessions-$i \
    --property-name session_type --type string

  wrangler vectorize create-metadata-index brioela-sessions-$i \
    --property-name ended_at --type number
done
```

Add `COHERE_API_KEY` to `wrangler.jsonc` secrets. Add all 20 `SESSIONS_VEC_*` bindings to `wrangler.jsonc`.

---

## Limits — Workers Paid

| Limit | Value | Brioela usage |
|---|---|---|
| Max dimensions | 1536 | 768 ✓ |
| Max namespaces per index | 50,000 | 1 per user ✓ |
| Max vectors per index | 10,000,000 | ~2.5M per shard at 1M users ✓ |
| topK with `returnMetadata: 'all'` | 50 | We use topK=10 ✓ |
| Max vector ID length | 64 bytes | UUID = 36 chars ✓ |
| Max namespace name length | 64 bytes | userId = UUID = 36 chars ✓ |
| Upsert batch size (binding) | 1,000 | We upsert 1 at a time ✓ |
