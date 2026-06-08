# Tool: read_user_memory

## Purpose

`read_user_memory` reads a specific fact or a full namespace from `user_memory` mid-session.

Most `user_memory` is loaded automatically at session start — relevant namespaces are injected into the system prompt by `load_session_context`. The agent does not need to call `read_user_memory` for facts it already has in context.

This tool exists for cases where the agent needs to read something that was not loaded at session start:
- A namespace not deemed relevant at session start becomes relevant mid-conversation
- The user asks about something specific: "what have you noted about my medications?"
- The agent wants to verify the exact current state of a fact before writing over it
- A background or alarm session needs a specific fact without loading the full context

## When to Call It

Call `read_user_memory` when:
- A fact the agent needs was not injected into the session prompt at start
- The user explicitly asks what the agent has noted about something
- The agent needs to verify current state before a `write_user_memory` call
- A background session needs a targeted fact without full context load

Do NOT call `read_user_memory` for:
- Facts already present in the session's system prompt — they are in context, no tool call needed
- Loading all memory at session start — that is `load_session_context`'s job
- Searching memory by meaning — FTS5 and Vectorize handle search, not this tool

## Input Schema

```typescript
import { z } from 'zod'

export const ReadUserMemorySchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64),
  // Which namespace to read from.
  // Examples: 'health', 'dietary', 'family', 'preferences'

  key: z.string()
    .regex(/^[a-z][a-z0-9-]*$/)
    .max(64)
    .optional(),
  // Which key to read within the namespace.
  // If provided: returns that specific entry only.
  // If omitted: returns ALL active entries in the namespace.
})
```

## What It Reads

**When `key` is provided** — single entry lookup by primary key `namespace:key`:

```typescript
db.select()
  .from(userMemory)
  .where(
    and(
      eq(userMemory.id, `${namespace}:${key}`),
      eq(userMemory.isActive, true)
    )
  )
  .get()
```

**When `key` is omitted** — full namespace read:

```typescript
db.select()
  .from(userMemory)
  .where(
    and(
      eq(userMemory.userId, ctx.userId),
      eq(userMemory.namespace, namespace),
      eq(userMemory.isActive, true)
    )
  )
  .all()
```

Only `isActive = true` entries are returned. Deactivated facts are invisible to the agent.

## Side Effects

`read_count` and `last_read` are updated as fire-and-forget after the read returns — never awaited. The agent receives the result immediately. The increment happens in the background.

```typescript
// after returning result — fire and forget
ctx.waitUntil(
  db.update(userMemory)
    .set({ readCount: sql`read_count + 1`, lastRead: Date.now() })
    .where(eq(userMemory.id, `${namespace}:${key}`))
    .run()
)
```

## What It Returns

**Single key found:**
```json
{
  "found": true,
  "id": "health:medications",
  "namespace": "health",
  "key": "medications",
  "value": { "metformin": { "dose": "500mg", "frequency": "2x daily" } },
  "confidence": 1.0,
  "last_write": 1234567890000
}
```

**Single key not found:**
```json
{
  "found": false,
  "id": "health:medications"
}
```

Not an error. The agent treats `found: false` as "I have no record of this yet."

**Full namespace read:**
```json
{
  "namespace": "health",
  "count": 2,
  "entries": [
    {
      "key": "medications",
      "value": { "metformin": { "dose": "500mg", "frequency": "2x daily" } },
      "confidence": 1.0
    },
    {
      "key": "conditions",
      "value": { "type2_diabetes": true },
      "confidence": 0.9
    }
  ]
}
```

**Namespace empty or does not exist:**
```json
{
  "namespace": "health",
  "count": 0,
  "entries": []
}
```

Not an error. Empty namespace is a valid state.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Namespace or key format wrong | Zod error with failing field |
| Read failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, any session type
- **NOT the Brain maintenance** — the Brain maintenance does direct DB reads in its maintenance pass, not through tools
- **NOT device SDK** — device has no access to tools

## What Is NOT This Tool's Job

- Loading full session context at start → `load_session_context`
- Writing or updating a fact → `write_user_memory`
- Searching memory by meaning or keyword → FTS5 / Vectorize (no tool yet — handled internally)
- Reading deactivated facts → developer/admin only, not exposed as a tool
