# Brain — DO Class and Setup

## What This File Covers

`BrioelaBrain` class structure, `wrangler.jsonc` entries, SQLite initialization, WAL mode, Drizzle wiring, typed Agent RPC surface, schedule callbacks, long-running Agent SDK primitives, and the startup handoff into the Brain SQLite migration runtime.

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
├── brioela.brain.agent.ts           ← the Agent class (this file)
├── index.ts                         ← barrel export only
├── _schema/
│   ├── index.ts                     ← re-exports all tables
│   ├── memory.event.schema.ts
│   ├── user.memory.schema.ts
│   ├── user.personality.schema.ts
│   ├── skill.schema.ts
│   ├── skill.version.schema.ts
│   ├── constraint.schema.ts
│   ├── session.schema.ts
│   ├── session.turn.schema.ts
│   ├── recipe.schema.ts
│   ├── scheduled.alarm.schema.ts
│   ├── agent.state.schema.ts
│   └── schema.version.schema.ts
├── _rpc/
│   ├── read.brain.context.rpc.ts     ← typed callable read surface
│   ├── write.brain.memory.rpc.ts     ← typed callable write surface
│   ├── append.memory.event.rpc.ts
│   ├── check.active.session.rpc.ts
│   └── index.ts
├── _handlers/
│   ├── create.brain.session.handler.ts
│   ├── finalize.brain.session.handler.ts
│   ├── dispatch.brain.schedule.handler.ts
│   └── index.ts
├── _context/
│   ├── build.mira.scene.context.handler.ts
│   ├── load.session.context.handler.ts
│   ├── compress.session.context.handler.ts
│   └── index.ts
├── _policies/
│   ├── authorize.brain.tool.policy.ts
│   ├── enforce.memory.write.policy.ts
│   ├── enforce.privacy.boundary.policy.ts
│   └── index.ts
├── _schedules/
│   ├── schedule.brain.maintenance.handler.ts
│   ├── schedule.behavior.pattern.handler.ts
│   └── index.ts
├── _migrations/
│   ├── brain.migration.manifest.ts
│   ├── drizzle.migrations.ts
│   ├── index.ts
│   ├── _handlers/
│   │   ├── run.brain.migrations.handler.ts
│   │   ├── run.brain.migration.smoke.handler.ts
│   │   └── index.ts
│   ├── _helpers/
│   │   ├── acquire.brain.migration.lock.helper.ts
│   │   ├── read.brain.schema.readiness.helper.ts
│   │   ├── write.brain.schema.readiness.helper.ts
│   │   └── index.ts
│   ├── _policies/
│   │   ├── assert.brain.migration.allowed.policy.ts
│   │   └── index.ts
│   ├── _smoke/
│   │   ├── _handlers/
│   │   │   ├── smoke.brain.core.context.handler.ts
│   │   │   ├── smoke.brain.memory.write.handler.ts
│   │   │   ├── smoke.brain.active.session.handler.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── _subagents/
│   ├── brain-maintenance/
│   │   ├── brain.maintenance.agent.ts
│   │   ├── run.maintenance.pass.handler.ts
│   │   └── index.ts
│   ├── behavior-pattern/
│   │   ├── behavior.pattern.agent.ts
│   │   ├── run.behavior.pattern.pass.handler.ts
│   │   └── index.ts
│   └── session-context-compressor/
│       ├── session.context.compressor.agent.ts
│       ├── compress.session.context.handler.ts
│       └── index.ts
└── drizzle/
    ├── 0000_initial.sql
    ├── 0001_add_memory_event_indexes.sql
    └── meta/
```

The Brain folder is deliberately dense because it is the permanent truth-owner. Every file has one responsibility. Brain-owned child agents live under `_subagents/` so they are visibly subordinate to Brain, not peer brains.

---

## The DO Class

```typescript
// backend/src/agents/brain/brioela.brain.agent.ts

import { Agent } from 'agents'
import { callable } from 'agents'
import { drizzle } from 'drizzle-orm/durable-sqlite'
import * as schema from './_schema'
import { readBrainContext, writeBrainMemory, appendMemoryEvent, checkActiveSession } from './_rpc'
import { dispatchBrainSchedule } from './_handlers'
import { createBrainDatabase } from './_database'
import { runBrainMigrations } from './_migrations'
import type { Env } from '@/types/env'

export class BrioelaBrain extends Agent<Env> {
  private db: ReturnType<typeof drizzle>

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    // Wire Drizzle to DO storage. Each user's DO gets its own SQLite.
    this.db = createBrainDatabase(ctx.storage)

    // Startup is a gate, not a convenience hook. No request/RPC/alarm runs until
    // migrations and smoke tests mark this Brain ready.
    ctx.blockConcurrencyWhile(async () => {
      await runBrainMigrations({ db: this.db, env })
    })
  }

  // HTTP entry is for external Worker/client boundaries only.
  // Child agents call typed RPC methods on this class instead of POSTing to /internal/tool-call.
  override async fetch(request: Request): Promise<Response> {
    return super.fetch(request)
  }

  @callable()
  async readBrainContext(input: ReadBrainContext): Promise<BrainContext> {
    return readBrainContext(this.db, input)
  }

  @callable()
  async writeBrainMemory(input: WriteBrainMemory): Promise<BrainMemoryWrite> {
    return writeBrainMemory(this.db, input)
  }

  @callable()
  async appendMemoryEvent(input: AppendMemoryEvent): Promise<MemoryEvent> {
    return appendMemoryEvent(this.db, input)
  }

  @callable()
  async checkActiveSession(input: CheckActiveSession): Promise<ActiveSessionCheck> {
    return checkActiveSession(this.db, input)
  }

  async dispatchBrainSchedule(input: BrainSchedule): Promise<void> {
    await dispatchBrainSchedule(this, this.db, input)
  }
}
```

The sample uses `runBrainMigrations(...)` instead of calling the Drizzle migrator directly from the class. That runtime calls `drizzle-orm/durable-sqlite/migrator` internally, then owns the Brioela product safety layer: manifest checks, rollout policy, migration lock, smoke tests, readiness state, retry/backoff, and telemetry. The DO class must not inline that logic.

The DO class also does not call `ctx.storage.sql` directly. Raw Durable Object SQLite is metal. Brain product code uses Drizzle repositories/stores; only the approved database adapter/runtime boundary may touch lower-level storage when Drizzle wiring or unavoidable SQLite configuration requires it.

Hard startup rule:

```text
Drizzle migration tracking proves SQL file application.
Brain migration readiness proves the user's private Brain is safe to serve.
Both are required.
```

The class exposes the stable typed boundary. It does not contain business logic. The business logic lives in `_rpc/`, `_handlers/`, `_context/`, `_policies/`, `_schedules/`, and Brain-owned `_subagents/`.

---

## Typed RPC Boundary — Default Internal Transport

The default internal transport between Brain and Brain-owned child agents is typed Agents SDK RPC, not custom internal HTTP.

Use `subAgent()` when Brain starts a child:

```typescript
const runId = crypto.randomUUID()
const behaviorPattern = await this.subAgent(
  BehaviorPatternAgent,
  `behavior-pattern-${this.userId}-${runId}`,
)

await behaviorPattern.runBehaviorPatternPass({
  userId: this.userId,
  windowDays: 14,
})
```

Use `parentAgent()` when a child needs Brain-owned truth:

```typescript
const brain = await this.parentAgent<BrioelaBrain>()

const context = await brain.readBrainContext({
  userId,
  purpose: 'behavior_pattern_detection',
})

await brain.writeBrainMemory({
  userId,
  namespace: 'pattern',
  key: pattern.key,
  value: pattern.value,
  writtenBy: 'BehaviorPatternAgent',
})
```

Hard rule:

```text
BrioelaBrain owns permanent truth.
Brain-owned child agents do temporary work.
Child agents call Brain through typed RPC.
No child agent writes Brain SQLite directly.
Custom HTTP is only for external boundaries or cases where typed Agent RPC cannot express the boundary.
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
}
```

No `INTERNAL_SECRET` is needed for Brain-owned child agents talking to Brain through typed Agent RPC. If a future external HTTP boundary is introduced, that boundary gets its own explicit secret and its own `.policy.ts` file.
