# Backend — Durable Object and Agent Patterns

## Class Structure

Every DO extends `Agent` from `@cloudflare/agents`. The class is the single source of behavior for that DO. The class file (`index.ts`) only contains the class definition, `fetch()` handler routing, `alarm()` handler, and WebSocket lifecycle methods. Business logic lives in sibling files imported by the class.

```ts
// backend/src/agents/orchestrator/index.ts
import { Agent } from '@cloudflare/agents'
import { drizzle } from 'drizzle-orm/durable-sqlite'
import * as schema from './schema'
import { handleAlarm } from './alarm'
import { loadContext } from './context'
import { runCompress } from './compress'

export class BrioelOrchestrator extends Agent<Env> {
  db = drizzle(this.ctx.storage, { schema })

  async fetch(request: Request): Promise<Response> {
    // Route incoming requests to the correct method
    const url = new URL(request.url)

    if (url.pathname === '/context') return this.getContext(request)
    if (url.pathname === '/memory/write') return this.writeMemory(request)
    if (url.pathname === '/memory/read') return this.readMemory(request)
    if (url.pathname === '/constraint/propose') return this.proposeConstraint(request)

    return new Response('Not found', { status: 404 })
  }

  async alarm(): Promise<void> {
    await handleAlarm(this.db, this.ctx, this.env)
  }

  // Public methods called by route handlers via DO RPC
  async getContext(request: Request): Promise<Response> {
    const context = await loadContext(this.db)
    return Response.json(context)
  }

  async writeMemory(request: Request): Promise<Response> {
    // ... delegates to lib
  }
}
```

---

## SQLite Schema — Per DO

Each DO has its own `schema.ts`. Tables are defined with Drizzle's `sqliteTable` (not `pgTable`). The schema file only defines tables — no queries, no business logic.

```ts
// backend/src/agents/orchestrator/schema.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const memoryEvents = sqliteTable('memory_events', {
  id:        text('id').primaryKey(),
  type:      text('type').notNull(),
  payload:   text('payload').notNull(),  // JSON stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const userMemory = sqliteTable('user_memory', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),       // JSON
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const constraints = sqliteTable('constraints', {
  id:        text('id').primaryKey(),
  type:      text('type').notNull(),  // 'allergy' | 'dislike' | 'boycott' | 'dietary'
  value:     text('value').notNull(),
  severity:  text('severity').notNull(), // 'hard' | 'soft'
  source:    text('source').notNull(),  // 'user' | 'ai_proposed' | 'medical'
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const recipes = sqliteTable('recipes', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  ingredients: text('ingredients').notNull(),  // JSON
  steps:       text('steps').notNull(),         // JSON
  source:      text('source'),
  confidence:  real('confidence'),
  createdAt:   integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

---

## Alarm Pattern

DO alarms are the ambient intelligence mechanism. An alarm is set by the DO scheduling itself to wake at a future time. When it wakes, `alarm()` runs.

The `alarm.ts` file handles dispatch — it reads the alarm type from DO storage and routes to the correct handler:

```ts
// backend/src/agents/orchestrator/alarm.ts
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type * as schema from './schema'

type AlarmType =
  | 'weekly-summary'
  | 'pattern-detection'
  | 'pantry-prediction'
  | 'pre-trip-prefetch'
  | 'illness-followup'

export async function handleAlarm(
  db: ReturnType<typeof drizzle>,
  ctx: DurableObjectState,
  env: Env,
): Promise<void> {
  const alarmType = await ctx.storage.get<AlarmType>('pending_alarm_type')
  if (!alarmType) return

  await ctx.storage.delete('pending_alarm_type')

  switch (alarmType) {
    case 'weekly-summary':    return runWeeklySummary(db, env)
    case 'pattern-detection': return runPatternDetection(db, env)
    case 'pantry-prediction': return runPantryPrediction(db, env)
    case 'pre-trip-prefetch': return runPreTripPrefetch(db, env)
    case 'illness-followup':  return runIllnessFollowup(db, env)
    default: {
      const _exhaustive: never = alarmType
      throw new Error(`Unknown alarm type: ${_exhaustive}`)
    }
  }
}

function scheduleNextAlarm(ctx: DurableObjectState, type: AlarmType, delayMs: number): void {
  ctx.storage.put('pending_alarm_type', type)
  ctx.storage.setAlarm(Date.now() + delayMs)
}
```

---

## WebSocket Pattern (Cooking Session DO)

The CookingAgent DO holds WebSocket connections open using CF hibernation. WebSocket lifecycle methods are defined directly on the class:

```ts
// backend/src/agents/cooking/index.ts
import { Agent } from '@cloudflare/agents'

export class CookingAgent extends Agent<Env> {
  db = drizzle(this.ctx.storage, { schema })

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request)
    }
    // ... other endpoints
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.ctx.acceptWebSocket(server)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  // WebSocket event handlers — called by CF runtime on each event
  // CPU budget resets for each event — 2hr session = thousands of short events
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // handle incoming audio/message
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    // clean up, flush session state to Orchestrator DO
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    ws.close(1011, 'Internal error')
  }
}
```

---

## DO Storage Rules

- **SQLite via Drizzle**: always preferred for structured data. Never `this.ctx.storage.get/put` for structured records.
- **KV storage** (`this.ctx.storage.get/put`): only for simple scalar values like alarm metadata (`pending_alarm_type`), session flags, counters.
- **Never raw JSON strings in KV**: if you need to store a JSON object in KV, it goes in SQLite.
- **`wrangler.toml` must declare `new_sqlite_classes`** for every DO that uses Drizzle SQLite. Without this, the DO gets KV-only storage.

```toml
# wrangler.toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelOrchestrator", "CookingAgent"]
```

---

## Tool Pattern

Every AI-callable tool is a standalone async function in its own file. Tools are pure functions — they receive typed inputs, interact with the DO's db or external services, and return typed outputs.

```ts
// backend/src/tools/memory/write-user-memory.ts
import { z } from 'zod'
import type { DrizzleSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { eq } from 'drizzle-orm'
import { userMemory } from '../../agents/orchestrator/schema'

export const WriteUserMemoryInputSchema = z.object({
  key:   z.string().min(1),
  value: z.unknown(),  // stored as JSON
})

export type WriteUserMemoryInput  = z.output<typeof WriteUserMemoryInputSchema>
export type WriteUserMemoryOutput = { success: true }

export async function writeUserMemory(
  db: DrizzleSQLiteDatabase,
  input: WriteUserMemoryInput,
): Promise<WriteUserMemoryOutput> {
  await db
    .insert(userMemory)
    .values({
      key:       input.key,
      value:     JSON.stringify(input.value),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userMemory.key,
      set: { value: JSON.stringify(input.value), updatedAt: new Date() },
    })

  return { success: true }
}
```

Key properties of every tool:
- Input validated by Zod schema before function body executes
- Return type explicitly declared
- No side effects outside the function's documented purpose
- No access to `c.env` directly — receives what it needs as parameters
- Exported from `backend/src/tools/index.ts` — no direct imports
