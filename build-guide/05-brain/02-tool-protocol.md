# Brain — Tool Protocol

## What This File Covers

The tool protocol design contract: all 17 internal SQLite AI-callable tools, the tool definition pattern, how tools are registered on the Brain, Zod validation at the tool boundary, caller permissions, and typed Brain RPC wrappers for Brain-owned child agents. This file describes what must be implemented; it is not proof that `backend/src/agents/brain/_tools/` exists yet.

---

## Core Rule

Tools are the ONLY interface between the LLM and SQLite. Every write to every table happens through a tool. Every structured read that is not automatic context loading happens through a tool. Direct SQLite queries from the agent's LLM layer are not possible and not wanted — tools are the typed, validated, auditable interface.

Adding a new capability = write one `tool({})` definition. The AI starts using it automatically. No routing logic. No developer pre-selection.

---

## Tool Definition Pattern

Every tool is organized into granular subdirectories under `backend/src/agents/brain/_tools/`:
- `_prompts/`: Contains the tool description/prompt string. Files must use the `.prompt.ts` suffix (e.g., `write.user.memory.prompt.ts`).
- `_executable/`: Contains the async execution logic function. Files must use the `.executable.ts` suffix (e.g., `write.user.memory.executable.ts`).
- `_schemas/`: Contains the Zod parameters schema. Files must use the `.schema.ts` suffix (e.g., `write.user.memory.schema.ts`).

### Strict Rules:
1. **Barrel index.ts files**: Every underscore-scoped folder (`_prompts`, `_executable`, `_schemas`) must contain an `index.ts` file that exports all elements from its respective subdirectory.
2. **Zod imports**: Zod schemas must only import `z` from `@brioela/shared/zod`. Do not use `zod` directly.
3. **No banned Lexicon variables**: Banned words such as `input`, `output`, `result`, or `payload` must not be used as variable/parameter names in tool files.

### Code Organization Example:

```typescript
// backend/src/agents/brain/_tools/_prompts/write.user.memory.prompt.ts
export const writeUserMemoryPrompt = 'Write or merge a structured fact into user_memory. Use namespace:key addressing. Merges intelligently — do not write the same fact twice.'
```

```typescript
// backend/src/agents/brain/_tools/_schemas/write.user.memory.schema.ts
import { z } from '@brioela/shared/zod'

export const writeUserMemorySchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/, 'namespace must be dot-separated lowercase, max 3 levels')
    .describe('dot-separated namespace: e.g. health.medications or cooking.preferences'),
  key: z.string()
    .regex(/^[a-z][a-z0-9_]*$/, 'key must be lowercase with underscores only')
    .describe('the fact key within this namespace'),
  value: z.record(z.string(), z.json()).describe('the fact value to store — always a JSON object'),
  confidence: z.number().min(0).max(1).describe('0.0–1.0 confidence in this fact'),
  source: z.enum(['observed', 'stated', 'inferred']).describe('how this fact was determined'),
})
```

```typescript
// backend/src/agents/brain/_tools/_executable/write.user.memory.executable.ts
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeBrainUserMemory } from '@/agents/brain/_repositories'
import type { z } from '@brioela/shared/zod'
import type { writeUserMemorySchema } from '../_schemas/write.user.memory.schema'

export async function writeUserMemoryExecute(
  db: BrainDatabase,
  userId: string,
  { namespace, key, value, confidence, source }: z.infer<typeof writeUserMemorySchema>
) {
  // Intelligent merge and write logic here...
}
```

```typescript
// backend/src/agents/brain/_tools/_prompts/index.ts
export * from './write.user.memory.prompt'
export * from './read.user.memory.prompt'
export * from './log.memory.event.prompt'

// backend/src/agents/brain/_tools/_schemas/index.ts
export * from './write.user.memory.schema'
export * from './read.user.memory.schema'
export * from './log.memory.event.schema'

// backend/src/agents/brain/_tools/_executable/index.ts
export * from './write.user.memory.executable'
export * from './read.user.memory.executable'
export * from './log.memory.event.executable'
```

```typescript
// backend/src/agents/brain/_tools/write.user.memory.tool.ts
import { tool } from 'ai'
import { writeUserMemorySchema } from './_schemas/write.user.memory.schema'
import { writeUserMemoryPrompt } from './_prompts/write.user.memory.prompt'
import { writeUserMemoryExecute } from './_executable/write.user.memory.executable'
import type { BrainDatabase } from '@/agents/brain/_database'

export const writeUserMemoryTool = (db: BrainDatabase, userId: string) => (tool as any)({
  description: writeUserMemoryPrompt,
  parameters: writeUserMemorySchema,
  execute: async (params: any) => writeUserMemoryExecute(db, userId, params),
})
```

---

## All 17 Tools

| # | Tool name | File | Table | Who can call |
|---|---|---|---|---|
| 00 | `getBrainTools` | `get.brain.tools.ts` | all registered tools | filtered by `SessionKind` |
| 01 | `log_memory_event` | `log.memory.event.tool.ts` | `memory_event` | chat, cooking, alarm, behavior_pattern_detection |
| 02 | `write_user_memory` | `write.user.memory.tool.ts` | `user_memory` | chat, cooking, brain maintenance, behavior_pattern_detection |
| 03 | `read_user_memory` | `read.user.memory.tool.ts` | `user_memory` | chat, cooking |
| 04 | `create_user_skill` | `create-user-skill.tool.ts` | `skills` | chat, cooking |
| 05 | `update_user_skill` | `update-user-skill.tool.ts` | `skills` + `skill_versions` | chat, cooking, brain maintenance |
| 06 | `view_user_skill` | `view-user-skill.tool.ts` | `skills` | chat, cooking |
| 07 | `archive_user_skill` | `archive-user-skill.tool.ts` | `skills` | chat, cooking, brain maintenance |
| 08 | `delete_user_skill` | `delete-user-skill.tool.ts` | `skills` | chat, cooking |
| 09 | `propose_user_constraint` | `propose-user-constraint.tool.ts` | `constraints` | chat, cooking |
| 10 | `confirm_user_constraint` | `confirm-user-constraint.tool.ts` | `constraints` | chat |
| 11 | `schedule_user_alarm` | `schedule-user-alarm.tool.ts` | `scheduled_alarms` | chat, cooking, brain maintenance, behavior_pattern_detection |
| 12 | `cancel_user_alarm` | `cancel-user-alarm.tool.ts` | `scheduled_alarms` | chat, cooking |
| 13 | `view_user_recipe` | `view-user-recipe.tool.ts` | `recipes` | chat, cooking |
| 14 | `update_user_recipe` | `update-user-recipe.tool.ts` | `recipes` | chat, cooking |
| 15 | `archive_user_recipe` | `archive-user-recipe.tool.ts` | `recipes` | chat, cooking |
| 16 | `load_session_context` | `load-session-context.tool.ts` | `sessions` + related | chat, cooking |
| 17 | `search_session_history` | `search-session-history.tool.ts` | FTS5 over `session_turns` | chat, cooking |

---

## Tool Registration on the Brain

Tools are passed to the Agent SDK's `generateText` (or `streamText`) call. They are not pre-registered as class methods. The set of available tools changes per session type — a `chat` session gets the full tool set; an `alarm` session gets a restricted subset.

```typescript
// backend/src/agents/brain/_handlers/session.handler.ts

import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getBrainTools } from '../_tools/get.brain.tools'
import { buildSystemPrompt } from './system-prompt.builder'
import type { SessionType } from '@brioela/shared'

export async function runSession(
  db: DrizzleDB,
  env: Env,
  userId: string,
  sessionType: SessionType,
  messages: CoreMessage[],
): Promise<ReadableStream> {
  const tools   = getBrainTools(db, userId, sessionType)
  const sysPrompt = await buildSystemPrompt(db, sessionType)

  const { textStream } = streamText({
    model:    anthropic('claude-sonnet-4-6'),
    system:   sysPrompt,
    messages,
    tools,
    maxSteps: 15,   // prevents infinite tool loops
  })

  return textStream
}
```

```typescript
// Session handler — import registry from get.brain.tools.ts

import { getBrainTools, sessionKindSchema } from '@/agents/brain/_tools/get.brain.tools'

const kind = sessionKindSchema.parse(sessionType)
const tools = getBrainTools(db, userId, kind, activeSessionId, waitUntil, wake)
```

---

## Alarm wake callbacks

`schedule_user_alarm` and `cancel_user_alarm` require injected `AlarmWakeCallbacks` from the Brain DO layer. Code: `getBrainTools(..., wake?)` in `get.brain.tools.ts`.

```typescript
type AlarmWakeCallbacks = {
  scheduleAlarm: (scheduledAtMs: number) => Promise<void>  // MIN pending scheduled_at
  cancelAlarm:   () => Promise<void>                      // no pending rows remain
}
```

Tool executables write SQLite first, then call `readEarliestPendingScheduledAt` and either `scheduleAlarm(next.scheduledAt)` or `cancelAlarm()`. They never call `this.ctx.storage.setAlarm()` directly.

If `wake` is omitted, alarm tools are not registered for that session build.

---

## Typed Brain RPC — Child Agent Tool Access

Brain-owned child agents (BrainMaintenanceAgent, BehaviorPatternAgent, SessionContextCompressor) do not call a custom HTTP forwarding endpoint by default. They call typed Brain RPC methods exposed by `BrioelaBrain`. The Brain RPC method validates input, enforces caller permission, executes the underlying tool or handler against Brain SQLite, and returns a typed result.

The model still sees normal AI SDK tools. The wrapper around each tool calls Brain RPC instead of importing Brain schema or opening Brain SQLite.

```typescript
// backend/src/agents/brain/_subagents/behavior-pattern/_helpers/build.behavior.pattern.tools.helper.ts

import { tool } from 'ai'
import { z } from 'zod'
import type { BrioelaBrain } from '../../brioela.brain.agent'

export function buildBehaviorPatternTools(brain: BrioelaBrain, runId: string) {
  return {
    write_user_memory: tool({
      description: 'Write a confirmed behavior pattern into Brain memory.',
      parameters: z.object({
        key: z.string().min(1),
        description: z.string().min(1),
        eventIds: z.array(z.string()).min(3),
        confidence: z.number().min(0).max(1),
      }),
      execute: async (input) => {
        return brain.writeBrainMemory({
          namespace: 'pattern',
          key: input.key,
          value: JSON.stringify(input),
          confidence: input.confidence,
          source: 'inferred',
          writtenBy: 'BehaviorPatternAgent',
          runId,
        })
      },
    }),
  }
}
```

Rules:

- Child agents never import Brain `_schema/` directly.
- Child agents never construct Brain SQLite connections.
- Child agents get a typed Brain stub through `parentAgent<BrioelaBrain>()`.
- Brain RPC methods validate Zod input and enforce caller permissions through `_policies/`.
- Custom HTTP forwarding is a fallback only for external boundaries where Agents SDK typed RPC is unavailable.

---

## Namespace Rules for `write_user_memory`

Enforced by Zod at the tool boundary — the tool rejects any call that violates these rules before touching SQLite.

```
Format:    dot-separated lowercase, max 3 levels
Regex:     /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/
Max total: 40 active namespaces per user (checked at insert, rejected at cap)
Examples:
  health.medications        ← valid (2 levels)
  cooking.preferences       ← valid (2 levels)
  cooking.techniques.pasta  ← valid (3 levels)
  Health.Medications        ← INVALID (uppercase)
  a                         ← INVALID (single word with no domain)
  a.b.c.d                   ← INVALID (4 levels)
```

The 40-namespace cap is checked inside the tool execute function before insert:

```typescript
const namespaceCount = db
  .selectDistinct({ namespace: userMemory.namespace })
  .from(userMemory)
  .all().length

if (namespaceCount >= 40) {
  // Check if this namespace already exists — updating existing is always allowed
  const exists = db.select().from(userMemory)
    .where(eq(userMemory.namespace, namespace)).get()
  if (!exists) {
    return { action: 'rejected', reason: '40-namespace cap reached. Archive or consolidate before adding new namespaces.' }
  }
}
```
