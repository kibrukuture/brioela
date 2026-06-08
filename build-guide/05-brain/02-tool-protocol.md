# Brain — Tool Protocol

## What This File Covers

The complete tool protocol: all 17 AI-callable tools, the tool definition pattern, how tools are registered on the Brain, Zod validation at the tool boundary, TOOL_PERMISSIONS for sub-agent authorization, and the `/internal/tool-call` forwarding endpoint.

---

## Core Rule

Tools are the ONLY interface between the LLM and SQLite. Every write to every table happens through a tool. Every structured read that is not automatic context loading happens through a tool. Direct SQLite queries from the agent's LLM layer are not possible and not wanted — tools are the typed, validated, auditable interface.

Adding a new capability = write one `tool({})` definition. The AI starts using it automatically. No routing logic. No developer pre-selection.

---

## Tool Definition Pattern

Every tool is a standalone file in `backend/src/agents/brain/_tools/`. It exports one async function and one Vercel AI SDK `tool()` call that wraps it.

```typescript
// backend/src/agents/brain/_tools/write-user-memory.tool.ts

import { tool } from 'ai'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { userMemory } from '../_schema'
import type { DrizzleDB } from '@/types/db'

const WriteUserMemoryInputSchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/, 'namespace must be dot-separated lowercase, max 3 levels')
    .describe('dot-separated namespace: e.g. health.medications or cooking.preferences'),
  key: z.string()
    .regex(/^[a-z][a-z0-9_]*$/, 'key must be lowercase with underscores only')
    .describe('the fact key within this namespace'),
  value: z.string().min(1).max(2000).describe('the fact value to store'),
  confidence: z.number().min(0).max(1).describe('0.0–1.0 confidence in this fact'),
  source: z.enum(['observed', 'stated', 'inferred']).describe('how this fact was determined'),
})

export const writeUserMemoryTool = (db: DrizzleDB) => tool({
  description: 'Write or merge a structured fact into user_memory. Use namespace:key addressing. Merges intelligently — do not write the same fact twice.',
  parameters: WriteUserMemoryInputSchema,
  execute: async ({ namespace, key, value, confidence, source }) => {
    const existing = db
      .select()
      .from(userMemory)
      .where(and(
        eq(userMemory.namespace, namespace),
        eq(userMemory.key, key),
      ))
      .get()

    if (existing) {
      // Only overwrite if incoming confidence is higher, or source is 'stated'
      if (confidence <= existing.confidence && source !== 'stated') {
        return { action: 'skipped', reason: 'existing confidence is equal or higher' }
      }
      db.update(userMemory)
        .set({ value, confidence, source, updatedAt: Date.now() })
        .where(and(eq(userMemory.namespace, namespace), eq(userMemory.key, key)))
        .run()
      return { action: 'updated', namespace, key }
    }

    db.insert(userMemory).values({
      id: crypto.randomUUID(),
      namespace,
      key,
      value,
      confidence,
      source,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).run()

    return { action: 'created', namespace, key }
  },
})
```

---

## All 17 Tools

| # | Tool name | File | Table | Who can call |
|---|---|---|---|---|
| 01 | `log_memory_event` | `log-memory-event.tool.ts` | `memory_event` | chat, cooking, alarm, pattern_detection |
| 02 | `write_user_memory` | `write-user-memory.tool.ts` | `user_memory` | chat, cooking, curator, pattern_detection |
| 03 | `read_user_memory` | `read-user-memory.tool.ts` | `user_memory` | chat, cooking |
| 04 | `create_user_skill` | `create-user-skill.tool.ts` | `skills` | chat, cooking |
| 05 | `update_user_skill` | `update-user-skill.tool.ts` | `skills` + `skill_versions` | chat, cooking, curator |
| 06 | `view_user_skill` | `view-user-skill.tool.ts` | `skills` | chat, cooking |
| 07 | `archive_user_skill` | `archive-user-skill.tool.ts` | `skills` | chat, cooking, curator |
| 08 | `delete_user_skill` | `delete-user-skill.tool.ts` | `skills` | chat, cooking |
| 09 | `propose_user_constraint` | `propose-user-constraint.tool.ts` | `constraints` | chat, cooking |
| 10 | `confirm_user_constraint` | `confirm-user-constraint.tool.ts` | `constraints` | chat |
| 11 | `schedule_user_alarm` | `schedule-user-alarm.tool.ts` | `scheduled_alarms` | chat, cooking, curator, pattern_detection |
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
import { getToolsForSessionType } from '../_tools'
import { buildSystemPrompt } from './system-prompt.builder'
import type { SessionType } from '@brioela/shared'

export async function runSession(
  db: DrizzleDB,
  env: Env,
  sessionType: SessionType,
  messages: CoreMessage[],
): Promise<ReadableStream> {
  const tools   = getToolsForSessionType(db, sessionType)
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
// backend/src/agents/brain/_tools/index.ts

import { writeUserMemoryTool }      from './write-user-memory.tool'
import { readUserMemoryTool }       from './read-user-memory.tool'
import { logMemoryEventTool }       from './log-memory-event.tool'
import { createUserSkillTool }      from './create-user-skill.tool'
import { updateUserSkillTool }      from './update-user-skill.tool'
import { viewUserSkillTool }        from './view-user-skill.tool'
import { archiveUserSkillTool }     from './archive-user-skill.tool'
import { deleteUserSkillTool }      from './delete-user-skill.tool'
import { proposeUserConstraintTool } from './propose-user-constraint.tool'
import { confirmUserConstraintTool } from './confirm-user-constraint.tool'
import { scheduleUserAlarmTool }    from './schedule-user-alarm.tool'
import { cancelUserAlarmTool }      from './cancel-user-alarm.tool'
import { viewUserRecipeTool }       from './view-user-recipe.tool'
import { updateUserRecipeTool }     from './update-user-recipe.tool'
import { archiveUserRecipeTool }    from './archive-user-recipe.tool'
import { loadSessionContextTool }   from './load-session-context.tool'
import { searchSessionHistoryTool } from './search-session-history.tool'
import type { DrizzleDB } from '@/types/db'
import type { SessionType } from '@brioela/shared'

const TOOL_PERMISSIONS: Record<SessionType | 'curator' | 'pattern_detection', string[]> = {
  chat: [
    'log_memory_event', 'write_user_memory', 'read_user_memory',
    'create_user_skill', 'update_user_skill', 'view_user_skill',
    'archive_user_skill', 'delete_user_skill',
    'propose_user_constraint', 'confirm_user_constraint',
    'schedule_user_alarm', 'cancel_user_alarm',
    'view_user_recipe', 'update_user_recipe', 'archive_user_recipe',
    'load_session_context', 'search_session_history',
  ],
  cooking: [
    'log_memory_event', 'write_user_memory', 'read_user_memory',
    'create_user_skill', 'update_user_skill', 'view_user_skill',
    'archive_user_skill',
    'propose_user_constraint',
    'schedule_user_alarm', 'cancel_user_alarm',
    'view_user_recipe', 'update_user_recipe',
    'load_session_context',
  ],
  alarm: [
    'log_memory_event', 'write_user_memory',
    'schedule_user_alarm', 'cancel_user_alarm',
  ],
  curator: [
    'write_user_memory', 'update_user_skill', 'archive_user_skill', 'schedule_user_alarm',
  ],
  pattern_detection: [
    'log_memory_event', 'write_user_memory', 'schedule_user_alarm',
  ],
}

export function getToolsForSessionType(db: DrizzleDB, caller: SessionType | 'curator' | 'pattern_detection') {
  const allowed = new Set(TOOL_PERMISSIONS[caller])
  const all = buildAllTools(db)
  return Object.fromEntries(
    Object.entries(all).filter(([name]) => allowed.has(name))
  )
}

function buildAllTools(db: DrizzleDB) {
  return {
    log_memory_event:        logMemoryEventTool(db),
    write_user_memory:       writeUserMemoryTool(db),
    read_user_memory:        readUserMemoryTool(db),
    create_user_skill:       createUserSkillTool(db),
    update_user_skill:       updateUserSkillTool(db),
    view_user_skill:         viewUserSkillTool(db),
    archive_user_skill:      archiveUserSkillTool(db),
    delete_user_skill:       deleteUserSkillTool(db),
    propose_user_constraint: proposeUserConstraintTool(db),
    confirm_user_constraint: confirmUserConstraintTool(db),
    schedule_user_alarm:     scheduleUserAlarmTool(db),
    cancel_user_alarm:       cancelUserAlarmTool(db),
    view_user_recipe:        viewUserRecipeTool(db),
    update_user_recipe:      updateUserRecipeTool(db),
    archive_user_recipe:     archiveUserRecipeTool(db),
    load_session_context:    loadSessionContextTool(db),
    search_session_history:  searchSessionHistoryTool(db),
  }
}
```

---

## `/internal/tool-call` — Sub-Agent Tool Forwarding Endpoint

Sub-agents (CuratorAgent, PatternDetectionAgent, CompressorAgent) have no SQLite. When they call a tool, the call is forwarded over HTTP to the Brain's `/internal/tool-call` endpoint, which executes it against the user's SQLite and returns the result.

```typescript
// backend/src/agents/brain/_handlers/internal-tool.handler.ts

import { getToolsForSessionType } from '../_tools'
import type { DrizzleDB } from '@/types/db'
import type { Env } from '@/types/env'

const InternalToolCallSchema = z.object({
  tool:   z.string(),
  caller: z.enum(['curator', 'pattern_detection', 'compressor', 'cooking']),
  args:   z.record(z.unknown()),
  run_id: z.string(),
})

export async function handleInternalToolCall(
  request: Request,
  db: DrizzleDB,
  env: Env,
): Promise<Response> {
  // Validate caller identity
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${env.INTERNAL_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const parsed = InternalToolCallSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tool: toolName, caller, args } = parsed.data

  // Enforce TOOL_PERMISSIONS — caller cannot exceed its allowed set
  const allowedTools = getToolsForSessionType(db, caller)
  if (!(toolName in allowedTools)) {
    return Response.json({ error: `caller '${caller}' is not permitted to call '${toolName}'` }, { status: 403 })
  }

  const toolDef = allowedTools[toolName as keyof typeof allowedTools]

  // Validate args against the tool's Zod schema
  const argsParsed = toolDef.parameters.safeParse(args)
  if (!argsParsed.success) {
    return Response.json({ error: argsParsed.error.flatten() }, { status: 422 })
  }

  // Execute against this DO's SQLite
  const result = await toolDef.execute(argsParsed.data, { abortSignal: AbortSignal.timeout(10_000) })
  return Response.json({ result })
}
```

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
