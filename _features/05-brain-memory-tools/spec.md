# Brain Memory Tools — Spec

Feature **07**. The agent's write/read path for `memory_event` (append-only history) and `user_memory` (structured mergeable facts), plus the system write path for device-originated events.

---

## Purpose

This feature is the foundation of Brioela's personal food brain:

- **`memory_event`** — immutable history of what happened (scans, sickness, cooking outcomes, travel intent, etc.).
- **`user_memory`** — current declarative facts derived from events and conversation (`namespace:key` addressing, merge-on-write, 40-namespace cap).

Three AI-callable tools expose the agent path. A separate **callable RPC** path lets system code (scanner, receipts, migration smoke) append events without going through the LLM.

---

## Tables owned

### `memory_event`

Append-only. Never updated. Never deleted.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `createId()` at insert |
| `user_id` | TEXT | Self-describing row |
| `kind` | TEXT | Free text — system constants + agent-invented kinds |
| `payload_json` | TEXT | JSON object, SQLite `json_valid` check |
| `captured_at` | INTEGER ms | When event occurred in the real world |
| `ingested_at` | INTEGER ms | When DO wrote the row — always now on insert |
| `source` | TEXT | System-set path identifier |
| `session_id` | TEXT nullable | Active session when agent logged; NULL for device/background |
| `entity_kind` | TEXT nullable | Indexable entity category |
| `entity_id` | TEXT nullable | Indexable entity id |
| `geo_hash` | TEXT nullable | 6-char geohash from client only — agent never fabricates |

**Indexes:** `(kind, captured_at)`, `(entity_kind, entity_id, captured_at)`, `(captured_at, id)`, `(session_id)`.

**Known system `kind` values:** `product_scanned`, `receipt_ingested`, `recipe_imported`, `recipe_cooked`, `meal_logged`, `sickness_logged`, `travel_intent`, `place_visited`, `constraint_declared`, `visual_intake`, `session_ended`, plus agent-freeform kinds.

### `user_memory`

Mergeable facts. Soft-deactivate only (`is_active = false`), never hard delete.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | `"${namespace}:${key}"` |
| `user_id` | TEXT | Owner |
| `namespace` | TEXT | Dot-separated, max 3 levels, lowercase |
| `key` | TEXT | Lowercase + underscores |
| `value` | TEXT | JSON object string |
| `confidence` | REAL 0–1 | Epistemic certainty |
| `source` | TEXT | `'observed' \| 'stated' \| 'inferred'` at tool boundary |
| `is_active` | BOOLEAN | false = invisible to agent reads |
| `importance` | INTEGER 1–10 | How much the fact matters for context |
| `read_count` | INTEGER | Prompt injection + explicit reads |
| `write_count` | INTEGER | Upsert count |
| `last_read` | INTEGER ms nullable | |
| `last_write` | INTEGER ms nullable | |
| `updated_at` | INTEGER ms | |

**Indexes:** `(namespace, is_active)`, `(is_active, last_write)`, `(source)`.

**40-namespace cap:** Distinct active namespaces ≤ 40. New namespace rejected when cap hit; error must include existing namespace list (spec requirement — see Gaps).

---

## Tool 1: `log_memory_event`

**Purpose:** Agent logs a durable real-world event during a session.

**When to call:** User reports something that happened; agent observes a pattern worth keeping; session produces a durable outcome.

**When NOT to call:** Conversation turns (automatic); facts → `write_user_memory`; constraints → constraint tools; hypotheticals.

**Input (agent-provided):**

| Field | Required | Notes |
|---|---|---|
| `kind` | yes | Free text |
| `payload` | yes | JSON object |
| `source` | yes | e.g. `'agent'` |
| `captured_at` | no | Defaults to now |
| `entity_kind` | no | |
| `entity_id` | no | |
| `geo_hash` | no | Client-only in practice |

**System-filled:** `id`, `user_id`, `session_id` (from active session), `ingested_at`.

**Returns:** `{ id, status: 'logged' }`

**Permissions (`SessionKind`):** `chat`, `cooking`, `alarm`, `behavior_pattern_detection` — NOT `brain_maintenance`.

**Side effects:** None immediate. No per-event alarm wake.

---

## Tool 2: `write_user_memory`

**Purpose:** Write or merge a structured fact.

**When to call:** Durable fact learned; fact refined; session-end extraction.

**When NOT to call:** Raw events; safety constraints; personality traits (maintenance-only).

**Input:**

| Field | Required | Notes |
|---|---|---|
| `namespace` | yes | Regex: `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$` |
| `key` | yes | Regex: `^[a-z][a-z0-9_]*$` |
| `value` | yes | JSON object |
| `confidence` | yes | 0.0–1.0 |
| `source` | yes | `'observed' \| 'stated' \| 'inferred'` |
| `importance` | no | **Spec:** LLM-assessed 1–10 at write time — **see Gaps** |

**Merge rules:**

1. New row if `namespace:key` absent.
2. Existing row: merge `{ ...old, ...new }` key-wise.
3. Skip write if `confidence <= existing.confidence` AND `source !== 'stated'`.
4. `'stated'` bypasses confidence gate and may overwrite at lower confidence.

**Namespace cap:** Before first row in a new namespace, count distinct active namespaces. If ≥ 40, reject with namespace list.

**Returns:** `{ id, merged, write_count, status: 'written' }` or `{ action: 'skipped', reason }` or cap error.

**Permissions:** `chat`, `cooking`, `brain_maintenance`, `behavior_pattern_detection`.

> **Note:** Tool spec docs say maintenance must NOT write `user_memory`; build-guide permission table allows it. Code follows build-guide. Resolve in a future pass.

---

## Tool 3: `read_user_memory`

**Purpose:** Mid-session read when fact not already in prompt context.

**Input:** `namespace` required; `key` optional (omit = all active keys in namespace).

**Returns:**

- Single key: `{ found, id, namespace?, key?, value?, confidence?, last_write? }`
- Namespace: `{ namespace, count, entries[] }`
- Missing key: `{ found: false, id }` — not an error.

**Side effects:** Single-key read increments `read_count` + `last_read` fire-and-forget via `waitUntil` when available.

**Permissions:** `chat`, `cooking` only.

---

## System paths (non-tool)

### `appendMemoryEvent` callable RPC

Device/system code appends events without LLM. Used by scanner dual-write, migration smoke, future receipt pipeline.

- Validates `AppendBrainMemoryEvent` schema.
- Maps to row via `createMemoryEventWrite` (`createId()`, `ingested_at = now`).
- Returns `{ event }`.

### `listMemoryEvents` callable RPC

Keyset cursor pagination for internal consumers (illness detective, maintenance, debugging).

- `limit` 1–100, optional `(capturedAt, id)` cursor.
- Ordered `captured_at DESC, id DESC`.

---

## Passive memory load (related — not in this feature's code yet)

Per `implementable-specs/02-user-memory.md`:

- **`loadMemoryForPrompt(namespaces[])`** — injects active facts at session start; fire-and-forget `read_count` bump.
- **`memory_namespaces` list** — returned by `load_session_context` at session start.

These belong to features **17-brain-system-prompt** and **18-brain-session-tools**. This feature provides the tables and explicit tools they depend on.

---

## Split-tool file pattern

Every AI tool in this feature follows `_patterns/brain-tool` (when written):

```
_tools/<name>.tool.ts           — AI SDK tool wrapper only
_tools/_schemas/<name>.schema.ts
_tools/_prompts/<name>.prompt.ts
_tools/_executables/<name>.executable.ts
```

Repositories own all Drizzle access. Executables never import schema tables except via repositories.

---

## Gaps (feature NOT fully done — status stays `open`)

| # | Gap | Spec source |
|---|---|---|
| G1 | `importance` not accepted on `write_user_memory` input — always defaults to 5 | `02-user-memory.md` |
| G2 | Namespace cap error does not return existing namespace list for agent self-correction | `02-user-memory.md` |
| G3 | `loadMemoryForPrompt` not implemented | `02-user-memory.md` → feature 17 |
| G4 | `memory_namespaces` at session start not implemented | `02-user-memory.md` → feature 18 |
| G5 | Tools not wired into live `streamText` / chat session handler | feature 22 |
| G6 | Scanner dual-write to `memory_event` via `appendMemoryEvent` not built end-to-end | feature 26 + this RPC |
| G7 | Tool spec vs build-guide permission conflict on `brain_maintenance` writing `user_memory` | docs |

---

## Acceptance (feature fully done when)

- [ ] All three tools pass `memory.tool.test.ts` and extended tests for G1/G2.
- [ ] `appendMemoryEvent` + `listMemoryEvents` RPC green under DO tests.
- [ ] Schemas match implementable-specs column + index contracts.
- [ ] Split-tool layout matches build-guide `02-tool-protocol.md`.
- [ ] G1–G2 closed in executables/schemas.
- [ ] G3–G5 tracked in dependent features; this feature's scope marked complete when tools + RPC + repos are correct and tested in isolation.
- [ ] G6 closed when scanner writes through RPC in production path.

---

## Source documents

- `implementable-specs/01-memory-event.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/brioela-tools/01-log-memory-event.md`
- `implementable-specs/brioela-tools/02-write-user-memory.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0001.first-memory-tools.md`
