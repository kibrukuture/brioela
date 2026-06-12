# Brain Session Compression — Build

Feature **13**. Production paths under `backend/src/agents/brain/`.

**Depends on:** **12** `SessionContextCompressor` DO + Haiku handler; **11** session repos + watchdog cancel/schedule helpers; **20** turn loop caller.

---

## Shipped today

| Area | Status |
|---|---|
| `sessions.status` includes `'compressed'` | ✓ (**04** `session.schema.ts`) |
| `sessions.parent_session_id` + partial index | ✓ (**04**) |
| `sessions.outcome_summary` column (stores JSON summary) | ✓ (**04**) |
| `sessions.end_reason` supports `'compressed'` | ✓ (free text column) |
| `session_turns` immutable turn storage | ✓ (**04**) |
| `_schemas/compression.summary.schema.ts` | ✗ |
| `_constants/compression.thresholds.constant.ts` | ✗ |
| `_handlers/compress.session.handler.ts` | ✗ |
| `_handlers/format.continuation.context.helper.ts` | ✗ |
| Session compression repositories | ✗ |
| Compression unit tests | ✗ |
| **12** SessionContextCompressor DO | ✗ (blocks Haiku path) |
| **20** turn loop calling compression | ✗ |
| Vectorize re-embed on compress | ✗ (**17**) |

**No compression production code exists.** `rg compress backend/src/agents/brain` — zero handler files; only `compressed` enum in session schema.

---

## File manifest

### Schemas (**13** owns)

| File | Role |
|---|---|
| `_schemas/compression.summary.schema.ts` | Zod `compressionSummarySchema` + `CompressionSummary` type |

### Constants

| File | Role |
|---|---|
| `_constants/compression.thresholds.constant.ts` | `COMPRESSION_TURN_THRESHOLD`, `COMPRESSION_TOKEN_THRESHOLD` maps by `session_type` |

### Handlers (**13** core)

| File | Role |
|---|---|
| `_handlers/compress.session.handler.ts` | `checkCompressionNeeded`, `runCompression`, `applyCompression` |
| `_handlers/format.continuation.context.helper.ts` | `formatContinuationContext(summary, turns)` → prompt block string |

### Repositories (to build — may extend **11** session repos)

| File | Functions |
|---|---|
| `_repositories/read.session.compression.repository.ts` | `readSessionTurnsOrdered`, `readLastSessionTurns`, `getFullSessionChain` |
| `_repositories/write.session.compression.repository.ts` | `markSessionCompressed`, `insertContinuationSession` |

Export from `_repositories/index.ts` (not shipped).

### Consumers (**13** does not build — integration points)

| File | Role | Owner |
|---|---|---|
| `_subagents/session-context-compressor/*` | Haiku DO + handler + prompt | **12** |
| `_handlers/open.session.handler.ts` | Watchdog schedule reused by continuation insert | **11** |
| `brioela.brain.agent.ts` | `onMessage` calls `checkCompressionNeeded` | **20** |
| `_handlers/build.system.prompt.handler.ts` | May append continuation block | **15** / **20** |

---

## Handler contracts

### `checkCompressionNeeded(database, sessionId): boolean`

1. Load `inputTokens`, `turnCount`, `sessionType`.
2. Return `false` for missing session or `alarm` / `background`.
3. Compare to constants from `compression.thresholds.constant.ts`.
4. No side effects.

### Threshold constants (implement exactly)

```typescript
export const COMPRESSION_TURN_THRESHOLD: Record<'chat' | 'cooking', number> = {
  chat: 40,
  cooking: 80,
}

export const COMPRESSION_TOKEN_THRESHOLD: Record<'chat' | 'cooking', number> = {
  chat: 60_000,
  cooking: 100_000,
}
```

### `runCompression(database, env, brain, sessionId, userId, wake?)`

1. Assert session `active`.
2. `turns = readSessionTurnsOrdered(database, sessionId)`.
3. `last10 = readLastSessionTurns(database, sessionId, 10)`.
4. `summary = await brain.subAgent(SessionContextCompressor, \`compressor_${userId}_${sessionId}\`).compressContext({ sessionId, sessionType, turns })`.
5. `result = await applyCompression(database, sessionId, summary, last10, wake)`.
6. `continuationBlock = formatContinuationContext(summary, last10)`.
7. Return `{ ...result, continuationContextBlock: continuationBlock }`.

### `applyCompression(database, oldSessionId, summary, last10Turns, wake?)`

1. Transaction:
   - Update old: `status: compressed`, `outcomeSummary: JSON.stringify(summary)`, `endedAt`, `endReason: 'compressed'`.
   - Load old row for copy fields.
   - Insert new row: `parentSessionId`, inherited `sessionType`/`recipeId`/`model`, counters zeroed.
2. Cancel pending watchdog for `oldSessionId` (**11** pattern).
3. Schedule watchdog for `newSessionId` (**11** `WATCHDOG_DURATION_MS`).
4. Refresh wake slot if provided.
5. Return `{ newSessionId, compressionSummary, recentTurns: last10Turns }`.

### `formatContinuationContext(summary, turns)`

Produce the `[CONTINUATION CONTEXT — session was compressed]` block per **17** — four summary lines + numbered turn lines with `[role]` prefix.

---

## 12 vs 13 build split

| Build in **13** | Build in **12** |
|---|---|
| `compression.summary.schema.ts` | Consumes schema |
| `compress.session.handler.ts` | — |
| Continuation formatter + chain readers | — |
| Threshold constants | — |
| — | `session.context.compressor.agent.ts` |
| — | `compress.session.context.handler.ts` |
| — | `session.context.compressor.system.prompt.ts` |
| — | wrangler `SESSION_CONTEXT_COMPRESSOR` binding |

---

## Tests (to add)

| File | Cases |
|---|---|
| `_handlers/compress.session.handler.test.ts` | `checkCompressionNeeded` at 39/40 turns chat; 79/80 cooking; 59k/60k tokens; alarm returns false; `applyCompression` sets compressed + child link; watchdog cancel called; last-10 selection order; malformed summary throws without DB mutation |
| `_handlers/format.continuation.context.helper.test.ts` | Block shape matches **17** template; empty decisions default; <10 turns |

Mock **12** compressor in handler tests — inject `compressContext` stub returning valid summary.

```bash
cd backend && bunx vitest run src/agents/brain/_handlers/compress.session.handler.test.ts
cd backend && bunx vitest run src/agents/brain/_handlers/format.continuation.context.helper.test.ts
```

---

## Acceptance criteria

1. `compression.summary.schema.ts` exists; parses **17** example JSON.
2. Threshold constants match **17** table exactly (40/60k chat, 80/100k cooking).
3. `checkCompressionNeeded` is pure read — no mutations.
4. `runCompression` calls **12** compressor — does not inline Haiku (no duplicate summarization path).
5. Old session ends `compressed` with four-field JSON in `outcome_summary` — not `completed`.
6. Child session inherits `sessionType` (including `cooking`) — not hardcoded `chat`.
7. `parent_session_id` points to old session; counters zeroed on child.
8. Last **10** turns returned for prompt injection, ordered ASC by `turn_number`.
9. Old watchdog cancelled; new watchdog scheduled on continuation session.
10. `formatContinuationContext` produces **17** block structure.
11. `getFullSessionChain` walks parent links oldest-first.
12. No turn rows deleted or re-parented on compress.
13. Unit tests cover thresholds + apply path + formatter.
14. `bun run verify` passes after add.
15. **20** integration not required to mark **13** handler layer shipped — but **13** not fully shipped until **12** compressor + **20** caller exist end-to-end.

Do **not** mark **13** `shipped` until handler + schema + repos + tests exist **and** **12** compressor DO is wired **and** **20** invokes check before each user turn.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_handlers/compress.session.handler.test.ts
cd backend && bunx vitest run src/agents/brain/_handlers/format.continuation.context.helper.test.ts
cd backend && bun run verify
```

---

## Blocked by

- **04-brain-foundation** — schemas (shipped)
- **11-brain-sessions-lifecycle** — session repos, watchdog helpers (open)
- **12-brain-sub-agents** — SessionContextCompressor DO (open)
- **09-brain-alarm-tools** — cancel/schedule alarm repos (shipped; wake G1 open)

## Blocks

- **20-brain-chat-runtime** — needs compression hook before turn processing
- **17-brain-vectorize** — re-embed hook after compress (optional for **13** ship)
- **16-brain-session-tools** — reads compressed `outcome_summary` (parallel)

---

## Draft folder

See `status.md` for gap list and draft count. **12**-owned compressor drafts live in `_features/12-brain-sub-agents/draft/`.

---

## Sources

- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/08-session-turns.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md` (obsolete)
- `_records/implementation-ledger/brain/08-framework-hardening/0001.chat-entrypoint.md`
- `_features/12-brain-sub-agents/build.md` (12/13 split)
- `_features/11-brain-sessions-lifecycle/build.md`
