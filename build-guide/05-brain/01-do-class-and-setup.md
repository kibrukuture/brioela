# Brain — DO Class and Setup

## What This File Covers

`BrioelaBrain` class structure, `wrangler.jsonc` entries, SQLite initialization, WAL mode, Drizzle wiring, keepAlive pattern, and the DO's `fetch()` + `alarm()` entry points.

---

## `wrangler.jsonc` Entries Required

Two additions needed in `backend/wrangler.jsonc`. Without the `migrations` entry, the DO gets KV storage only — no SQLite.

```jsonc
"durable_objects": {
  "bindings": [
    { "name": "BRAIN",  "class_name": "BrioelaBrain" },
    { "name": "MIRA_SESSION", "class_name": "MiraSession" }
  ]
},

"migrations": [
  {
    "tag": "v1",
    "new_sqlite_classes": ["BrioelaBrain", "MiraSession"]
  }
]
```

`new_sqlite_classes` is what tells Cloudflare to provision a real SQLite file for each instance of these classes. Without it, `this.ctx.storage` is KV-only.

---

## File Location

```
backend/src/agents/brain/
├── brioela.brain.agent.ts    ← the DO class (this file)
├── _schema/
│   ├── index.ts                     ← re-exports all tables
│   ├── memory-event.schema.ts
│   ├── user-memory.schema.ts
│   ├── user-personality.schema.ts
│   ├── skills.schema.ts
│   ├── skill-versions.schema.ts
│   ├── constraints.schema.ts
│   ├── sessions.schema.ts
│   ├── session-turns.schema.ts
│   ├── recipes.schema.ts
│   ├── scheduled-alarms.schema.ts
│   ├── agent-state.schema.ts
│   └── schema-version.schema.ts
├── _tools/
│   └── index.ts                     ← re-exports all 17 tools
├── _handlers/
│   ├── alarm.handler.ts             ← alarm() dispatch
│   ├── session.handler.ts
│   └── internal-tool.handler.ts     ← /internal/tool-call endpoint
└── migrations/
    └── 0001_initial.sql
```

---

## The DO Class

```typescript
// backend/src/agents/brain/brioela.brain.agent.ts

import { Agent } from 'agents'
import { drizzle } from 'drizzle-orm/durable-sqlite'
import { migrate } from 'drizzle-orm/durable-sqlite/migrator'
import * as schema from './_schema'
import { allTools } from './_tools'
import { handleAlarm } from './_handlers/alarm.handler'
import { handleInternalToolCall } from './_handlers/internal-tool.handler'
import type { Env } from '@/types/env'

export class BrioelaBrain extends Agent<Env> {
  private db: ReturnType<typeof drizzle>

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    // Wire Drizzle to DO storage. Each user's DO gets its own SQLite.
    this.db = drizzle(ctx.storage, { schema })

    // WAL mode must be set before any reads or writes.
    // Allows concurrent reads during a write — without it any write locks the entire DB.
    ctx.blockConcurrencyWhile(async () => {
      await ctx.storage.sql.exec('PRAGMA journal_mode=WAL;')
      await migrate(this.db, { migrationsFolder: './migrations' })
    })
  }

  // Main HTTP entry — routes to session handler or internal tool handler
  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/internal/tool-call') {
      return handleInternalToolCall(request, this.db, this.env)
    }

    // Agent SDK handles WebSocket upgrade + session routing
    return super.fetch(request)
  }

  // Fires when a DO alarm triggers.
  // All alarm types are dispatched through alarm.handler.ts.
  override async alarm(): Promise<void> {
    await handleAlarm(this.db, this.env, this.ctx)
  }
}
```

---

## keepAlive Pattern — Long Provider Work

Use Agents SDK primitives for long provider interactions. Do not implement a manual alarm heartbeat as the default; it competes with real scheduled work and is easy to orphan.

For work that should avoid idle eviction but does not need recovery, use `keepAliveWhile()`:

```typescript
await this.keepAliveWhile(async () => {
  await runProviderOperation()
})
```

For recoverable multi-step work, use a fiber:

```typescript
await this.runFiber('session-finalize', async (ctx) => {
  ctx.stash({ step: 'started', sessionId })
  await finalizeSession(sessionId)
})
```

Manual `ctx.storage.setAlarm()` keepalive loops are legacy fallback only.

---

## DO Addressing — Always `idFromName(userId)`

The Brain is always addressed by stable userId. No random IDs. No pooling.

```typescript
// In any Hono route handler
const brainId = env.BRAIN.idFromName(userId)
const brainStub = env.BRAIN.get(brainId)
const response = await brainStub.fetch(request)
```

The first call to `idFromName(userId)` for a new user creates a new DO instance with its own SQLite. Every subsequent call returns the same instance. The DO is geographically pinned to the region where it was first created — the user's requests are always routed to the same physical location.

---

## Env Type

```typescript
// backend/src/types/env.ts
export interface Env {
  BRAIN:   DurableObjectNamespace
  MIRA_SESSION:  DurableObjectNamespace
  SUPABASE_URL:   string
  SUPABASE_KEY:   string
  UPSTASH_REDIS_URL:      string
  UPSTASH_QSTASH_TOKEN:   string
  UPSTASH_WORKFLOW_TOKEN: string
  ANTHROPIC_API_KEY:      string
  GEMINI_API_KEY:         string
  INTERNAL_SECRET:        string   // shared between Worker and DO for /internal/ endpoints
}
```

`INTERNAL_SECRET` is a shared secret used to authenticate `/internal/tool-call` requests from sub-agents (CuratorAgent, PatternDetectionAgent) back to the Brain. Never exposed to clients.
