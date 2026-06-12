# Brain Vectorize — Build

Feature **17**. Production paths under `backend/src/agents/brain/` for embedding + Vectorize; wrangler account setup; hooks called from **11** / **13**.

**Depends on:** **04** Brain DO spine; **11** session close (embed trigger); **13** compression re-embed (optional for **13** ship); `COHERE_API_KEY` secret.

**Blocks:** Semantic session recall in **20**; optional **15** future prompt block from semantic snippets.

---

## Shipped today

| Area | Status |
|---|---|
| `sessions.outcome_summary` column + FTS triggers | ✓ (**04**, **11** schema) |
| Vectorize indexes `brioela-sessions-0`–`19` in Cloudflare | ✗ |
| `wrangler.jsonc` `SESSIONS_VEC_*` bindings | ✗ — file has DO only, no vectorize |
| `COHERE_API_KEY` secret | ✗ |
| `embedText` / Cohere client | ✗ |
| Shard helpers (`getShardIndex`, `getVectorIndex`) | ✗ |
| `embedAndStoreSessionVector` | ✗ |
| `semanticSearchSessions` | ✗ |
| Close-session `waitUntil` embed hook | ✗ (**11** G2) |
| Compression re-embed hook | ✗ (**13** G16) |
| `embedding.failed.*` agent_state writer | ✗ |
| Upstash retry workflow | ✗ (future) |
| Vectorize unit/integration tests | ✗ |
| `backend/src/lib/vector-sync.ts` | Legacy Schnl — **wrong contract**; not Brain path |

**No Brain Vectorize production code exists.** `rg embedText\|semanticSearchSessions\|SESSIONS_VEC\|getShardIndex backend/src/agents/brain` — zero matches.

---

## File manifest

### Helpers (`_helpers/`)

| File | Role |
|---|---|
| `_helpers/embed.text.helper.ts` | `embedText(text, inputType, env)` → Cohere REST, 768-dim array |
| `_helpers/get.shard.index.helper.ts` | `SHARD_COUNT`, `getShardIndex`, `getIndexName` (FNV-1a) |
| `_helpers/get.vector.index.helper.ts` | `getVectorIndex(userId, env)` → `Env[`SESSIONS_VEC_${n}`]` |

### Types (`_schemas/` or `_types/`)

| File | Role |
|---|---|
| `_schemas/session.vector.metadata.schema.ts` | `SessionVectorMetadata` Zod + TS type |

### Executables / services

| File | Role |
|---|---|
| `_executables/embed.and.store.session.executable.ts` | `embedAndStoreSessionVector` — embed + upsert |
| `_executables/reembed.session.on.compress.executable.ts` | Re-embed after **13** compression summary write |
| `_repositories/semantic.search.sessions.repository.ts` | `semanticSearchSessions` — query + SQLite hydrate |
| `_repositories/log.embedding.failed.repository.ts` | Insert `agent_state` `embedding.failed.{sessionId}` |

### Hooks (called from other features)

| File | Called by | Role |
|---|---|---|
| `_handlers/close.session.embedding.hook.ts` | **11** `closeSession` | `waitUntil(embedAndStore...)` + failure log |

Alternative: inline in **11** handler importing **17** executable — prefer thin hook file owned by **17**.

### Worker config

| File | Role |
|---|---|
| `backend/wrangler.jsonc` | Add 20 `vectorize` bindings |
| `backend/worker-configuration.d.ts` / generated Env | `SESSIONS_VEC_0`–`19: Vectorize`, `COHERE_API_KEY: string` |

### Tests

| File | Role |
|---|---|
| `_helpers/vectorize.helpers.test.ts` | FNV-1a distribution, shard range 0–19 |
| `_repositories/semantic.search.sessions.test.ts` | Mock Vectorize + threshold filter + namespace |
| `_executables/embed.and.store.session.test.ts` | Mock Cohere + upsert payload shape |

---

## Account setup checklist (run once per environment)

```bash
# Create indexes (repeat 0–19)
for i in $(seq 0 19); do
  bunx wrangler vectorize create "brioela-sessions-$i" \
    --dimensions=768 \
    --metric=cosine
done

# Metadata indexes — MUST exist before upsert
for i in $(seq 0 19); do
  bunx wrangler vectorize create-metadata-index "brioela-sessions-$i" \
    --property-name=session_type --type=string
  bunx wrangler vectorize create-metadata-index "brioela-sessions-$i" \
    --property-name=ended_at --type=number
done

# Secret
bunx wrangler secret put COHERE_API_KEY
```

Requires **wrangler ≥ 3.71.0** (Vectorize V2).

---

## Implementation contracts

### `embedText`

```typescript
export async function embedText(
  text: string,
  inputType: 'search_document' | 'search_query',
  env: Pick<Env, 'COHERE_API_KEY'>,
): Promise<number[]>
```

- POST `https://api.cohere.ai/v1/embed`
- Body: `{ texts: [text], model: 'embed-multilingual-v2.0', input_type: inputType, truncate: 'END' }`
- Validate response length === 768
- Throw typed error on non-2xx (caller logs to agent_state)

### `embedAndStoreSessionVector`

```typescript
export async function embedAndStoreSessionVector(params: {
  env: Env
  userId: string
  sessionId: string
  outcomeSummary: string
  sessionType: string
  recipeId: string | null
  endedAt: number
}): Promise<void>
```

Upsert payload:

```typescript
await index.upsert([{
  id: sessionId,
  values: vector,
  namespace: userId,
  metadata: {
    session_type: sessionType,
    ended_at: endedAt,
    recipe_id: recipeId ?? '',
  },
}])
```

### `semanticSearchSessions`

```typescript
export async function semanticSearchSessions(
  db: BrainDatabase,
  env: Env,
  userId: string,
  query: string,
  options?: {
    sessionType?: string
    sinceTs?: number
    recipeId?: string
    topK?: number
  },
): Promise<SemanticSessionHit[]>
```

- Default `topK = 10`
- Filter `score >= 0.65`
- Optional `recipeId` post-filter on metadata
- **Do not** import from **16** FTS executable — keep modules separate

### **11** integration

After synchronous session row update in `closeSession`:

```typescript
if (waitUntil) {
  waitUntil(
    scheduleSessionEmbedding({ db, env, userId, sessionId, ... })
      .catch(err => logEmbeddingFailed(db, userId, sessionId, err)),
  )
}
```

Pass `env` and `waitUntil` into **11** handler when Brain DO context available.

### **13** integration

After compression writes new summary to `outcome_summary`:

```typescript
await reembedSessionOnCompress({ db, env, userId, sessionId, compressionSummary, ... })
```

Fire-and-forget via `waitUntil` — same as close path.

### **16** boundary

`search.session.history.executable.ts` must **not** import Vectorize or `semanticSearchSessions`. Semantic recall is **20** orchestration or a future dedicated internal call — not the FTS tool.

### Legacy code

**Do not extend** `backend/src/lib/vector-sync.ts`. Brain path uses namespace-scoped upsert per `18-vectorize.md`. Remove or quarantine legacy file in separate cleanup PR.

---

## Acceptance criteria

1. All 20 Cloudflare indexes exist with metadata indexes for `session_type` and `ended_at`.
2. `wrangler.jsonc` declares `SESSIONS_VEC_0` through `SESSIONS_VEC_19`.
3. `embedText` returns 768 floats for both input types; errors on empty text.
4. `getShardIndex` is deterministic FNV-1a mod 20.
5. `getVectorIndex` resolves correct binding per userId.
6. `embedAndStoreSessionVector` upserts with `namespace: userId` and metadata shape from spec.
7. `semanticSearchSessions` applies threshold 0.65, namespace isolation, metadata filters.
8. `logEmbeddingFailed` writes `agent_state` key `embedding.failed.{sessionId}`.
9. **11** close path schedules embed without blocking return.
10. **13** compression path re-embeds (when **13** ships).
11. No Vectorize imports in **16** session tool files.
12. Tests pass: `bun run verify` / brain test suite.
13. Cohere failures do not crash session close.

Do **not** mark **17** `shipped` until indexes exist in target environment, bindings deployed, close hook wired, and semantic query tested against real or mocked Vectorize.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_helpers/vectorize.helpers.test.ts
cd backend && bunx vitest run src/agents/brain/_repositories/semantic.search.sessions.test.ts
cd backend && rg 'embedText|semanticSearchSessions|SESSIONS_VEC|embedAndStore' src/agents/brain
cd backend && rg 'vector-sync|syncVector' src/agents/brain   # expect zero
bunx wrangler vectorize list   # expect brioela-sessions-0..19 when provisioned
```

---

## Blocked by

| Feature | Blocker |
|---|---|
| **04** | Brain DO + `sessions` schema — ✓ |
| **11** | `closeSession` must exist to wire embed hook — open |
| **13** | Re-embed on compress — open (optional for **17** core) |

## Blocks

- **20-brain-chat-runtime** — semantic vs FTS orchestration, hybrid merge
- **15-brain-system-prompt** — optional future Block from semantic hits (not required for **17**)

---

## Draft folder

See `status.md` — **11** gap snapshots in `draft/`.

---

## Sources

- `_features/17-brain-vectorize/spec.md`
- `implementable-specs/18-vectorize.md`
- `build-guide/06-brain-memory/03-vectorize.md`
- `_features/11-brain-sessions-lifecycle/build.md`
- `_features/13-brain-session-compression/build.md`
- `_features/16-brain-session-tools/build.md`
- `backend/wrangler.jsonc`
