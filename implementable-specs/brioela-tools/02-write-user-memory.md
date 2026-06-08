# Tool: write_user_memory

## Purpose

`write_user_memory` writes a structured fact into `user_memory`. It is the tool that builds the user's knowledge base — the agent's durable understanding of who this person is.

Where `log_memory_event` says "something happened" (raw, unstructured, append-only), `write_user_memory` says "here is a fact I know about this user" (structured, namespaced, mergeable). These are two different things. Events are raw observations. Memory facts are derived conclusions.

Examples of what gets written here:
- User takes metformin → `namespace: health`, `key: medications`, `value: { metformin: { dose: "500mg", frequency: "2x daily" } }`
- User's daughter is named Sara → `namespace: family`, `key: daughter`, `value: { name: "Sara" }`
- User prefers spicy food → `namespace: dietary`, `key: spice_preference`, `value: { level: "high" }`

## When to Call It

Call `write_user_memory` when:
- The agent learns a durable fact about the user that should persist across sessions
- A fact changes or is refined — the merge logic handles updating without losing old keys
- A session ends and facts extracted from that session need to be written to memory

Do NOT call `write_user_memory` for:
- Raw events (something that happened) → use `log_memory_event`
- Safety constraints (allergies, intolerances) → use `propose_user_constraint`
- Personality traits (behavioral patterns) → Brain maintenance only, no tool
- Anything the agent is uncertain about — only write facts with reasonable confidence

## Input Schema

```typescript
import { z } from 'zod'

export const WriteUserMemorySchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The namespace this fact belongs to.
  // Examples: 'health', 'dietary', 'family', 'preferences', 'travel', 'work'
  // The agent sees the existing namespace list before writing — it extends
  // what exists rather than inventing new ones. Max 40 distinct namespaces.
  // Format: lowercase, hyphens only. Same discipline as skill names.

  key: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // The key within the namespace.
  // Examples: 'medications', 'daughter', 'spice-preference', 'home-city'
  // The composite id is namespace:key — this must be unique within the user's memory.
  // Format: lowercase, hyphens only.

  value: z.record(z.unknown()),
  // The fact value — always a JSON object, never a primitive.
  // Reason: primitives cannot be merged. An object can always receive new keys.
  // Examples:
  //   { metformin: { dose: "500mg", frequency: "2x daily" } }
  //   { name: "Sara", age_approximate: 8 }
  //   { level: "high", tolerance_notes: "enjoys berbere at full strength" }

  source: z.string().min(1),
  // Where this fact came from. Free text.
  // Examples: 'agent', 'user_stated', 'inferred_from_session'

  confidence: z.number().min(0).max(1).optional().default(1.0),
  // How confident the agent is in this fact. 0.0 to 1.0.
  // Default 1.0 for facts the user explicitly stated.
  // Lower for inferred facts: 0.7 for "user seems to prefer X based on behavior"
})
```

## Merge Logic

`write_user_memory` is NEVER a simple overwrite. The merge rule is:

```typescript
const existing = db.select().from(userMemory).where(eq(userMemory.id, `${namespace}:${key}`)).get()

const merged = existing
  ? { ...JSON.parse(existing.value), ...input.value }  // merge — old keys preserved
  : input.value                                          // new entry — no merge needed
```

Old keys are NEVER lost. If the existing value is `{ dose: "500mg" }` and the new value is `{ frequency: "2x daily" }`, the result is `{ dose: "500mg", frequency: "2x daily" }`. Both keys survive.

If a key exists in both old and new, the new value wins for that key only.

## 40 Namespace Cap

The user may have at most 40 distinct namespaces. This cap is enforced in this tool before every write:

```typescript
const namespaceCount = db
  .selectDistinct({ namespace: userMemory.namespace })
  .from(userMemory)
  .where(eq(userMemory.userId, ctx.userId))
  .all().length

const isNewNamespace = !existing || existing.namespace !== namespace

if (isNewNamespace && namespaceCount >= 40) {
  return { error: 'namespace_cap_reached', current: namespaceCount, max: 40 }
}
```

If the cap is reached, the tool returns an error. The agent must use an existing namespace or inform the user that memory is at capacity for new categories.

## What the System Fills In Automatically

| Field | Value |
|---|---|
| `id` | `${namespace}:${key}` — composite natural key, stable |
| `user_id` | From DO context |
| `isActive` | `true` — always active on write |
| `write_count` | Incremented by 1 on every write |
| `last_write` | `Date.now()` |
| `updated_at` | `Date.now()` |
| `read_count` | Not touched on write — only incremented on read |

## What It Writes

Upsert into `user_memory`:

```typescript
db.insert(userMemory)
  .values({
    id:         `${namespace}:${key}`,
    userId:     ctx.userId,
    namespace,
    key,
    value:      JSON.stringify(merged),
    confidence: input.confidence ?? 1.0,
    source:     input.source,
    isActive:   true,
    writeCount: (existing?.writeCount ?? 0) + 1,
    lastWrite:  Date.now(),
    updatedAt:  Date.now(),
    readCount:  existing?.readCount ?? 0,
    lastRead:   existing?.lastRead ?? null,
  })
  .onConflictDoUpdate({
    target: userMemory.id,
    set: {
      value:      JSON.stringify(merged),
      confidence: input.confidence ?? 1.0,
      source:     input.source,
      writeCount: sql`write_count + 1`,
      lastWrite:  Date.now(),
      updatedAt:  Date.now(),
    }
  })
```

## What It Returns

On success:

```json
{
  "id": "health:medications",
  "merged": true,
  "write_count": 3,
  "status": "written"
}
```

`merged: true` means an existing entry was updated. `merged: false` means a new entry was created. The agent uses this to know whether to say "I've updated your..." vs "I've noted that...".

## Side Effects

`read_count` increment on context load is fire-and-forget — not triggered by this tool. This tool only writes.

No alarm or background job is triggered by a memory write. Behavior behavior pattern detection runs on schedule, not per-write.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Namespace or key format wrong, value is not an object | Zod error with failing field |
| Namespace cap reached | 40 distinct namespaces already exist and this is a new namespace | `{ error: 'namespace_cap_reached', current: 40, max: 40 }` |
| Write failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session
- **NOT the Brain maintenance** — the Brain maintenance reads `user_memory` to infer personality traits. It never writes to `user_memory` directly.
- **NOT device SDK** — device events write to `memory_event` via the device endpoint. The agent extracts facts from those events and writes them here.

## What Is NOT This Tool's Job

- Logging raw events → use `log_memory_event`
- Safety constraints → use `propose_user_constraint`
- Reading a specific fact mid-session → use `read_user_memory`
- Deactivating a fact → set `isActive = false` directly (no tool yet — developer action)
