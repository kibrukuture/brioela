# Cooking Session — Tool Protocol

## How Tools Work During a Live Session

Gemini 3.1 Flash Live supports BLOCKING tool calls. When Gemini decides to call a tool, its audio output pauses. The DO executes the tool (either directly or by forwarding to the Brain DO) and sends a `tool_response` back to Gemini. Gemini resumes speaking.

The pause is imperceptible for fast tools (timers, memory writes — under 200ms). It is brief but noticeable for complex tool calls. Gemini handles this naturally: it says something like "let me set that" before calling the tool, then continues after the response arrives.

---

## Tool Declarations Sent to Gemini at Session Start

Only these tools are declared to Gemini for the cooking session. Gemini cannot call any tool not in this list.

```typescript
export const COOKING_TOOL_DECLARATIONS: GeminiFunctionDeclaration[] = [
  {
    name:        'schedule_timer',
    description: 'Set a cooking timer for a specified duration. Call this when the user asks to time something — "timer for 10 minutes", "remind me in 5 minutes when to flip". Do not ask for confirmation, just set it.',
    parameters: {
      type:       'OBJECT',
      properties: {
        label:    { type: 'STRING',  description: 'What the timer is for. E.g. "eggs", "onions", "rest the dough".' },
        seconds:  { type: 'INTEGER', description: 'Duration in seconds.' },
      },
      required: ['label', 'seconds'],
    },
  },
  {
    name:        'cancel_timer',
    description: 'Cancel a previously set cooking timer by label.',
    parameters: {
      type:       'OBJECT',
      properties: {
        label: { type: 'STRING', description: 'The timer label to cancel.' },
      },
      required: ['label'],
    },
  },
  {
    name:        'write_session_note',
    description: 'Write a note about something that happened in this cooking session. Use this for observations the user will want to remember — "she added extra berbere", "she reduced oil by half", "grandma said this is her grandmother\'s technique". Do not write notes for routine steps.',
    parameters: {
      type:       'OBJECT',
      properties: {
        note: { type: 'STRING', description: 'The note to record. Plain text, 10–300 characters.' },
      },
      required: ['note'],
    },
  },
  {
    name:        'write_memory',
    description: 'Write a persistent fact about the user into memory. Use this when you learn something durable — a preference, a health fact, a constraint. Do not call this for session-specific observations.',
    parameters: {
      type:       'OBJECT',
      properties: {
        namespace:  { type: 'STRING', description: 'Memory namespace. Check existing namespaces before creating new ones.' },
        key:        { type: 'STRING', description: 'Fact identifier within the namespace.' },
        value:      { type: 'OBJECT', description: 'JSON object with the fact content.' },
        importance: { type: 'INTEGER', description: '1–10. How important is this fact? 9–10 = allergy/medication. 5 = useful preference. 1–3 = minor observation.' },
      },
      required: ['namespace', 'key', 'value', 'importance'],
    },
  },
  {
    name:        'propose_constraint',
    description: 'Propose a new dietary constraint for the user — allergy, intolerance, religious restriction, dislike, or boycott. Call this when the user reveals something they cannot or will not eat. The constraint is unconfirmed until the user confirms it.',
    parameters: {
      type:       'OBJECT',
      properties: {
        constraint_type: { type: 'STRING', enum: ['allergy', 'intolerance', 'dislike', 'religious', 'boycott'] },
        ingredient:      { type: 'STRING', description: 'The specific ingredient or food.' },
        reason:          { type: 'STRING', description: 'Why the user cannot eat this (if stated). Optional.' },
      },
      required: ['constraint_type', 'ingredient'],
    },
  },
  {
    name:        'view_recipe',
    description: 'Load a recipe from the user\'s saved recipes. Call this if the user asks about a previously saved recipe during the session.',
    parameters: {
      type:       'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'The recipe title to look up.' },
      },
      required: ['title'],
    },
  },
]
```

---

## Tool Routing — Which DO Handles Each Tool

```typescript
const DIRECT_TOOLS   = new Set(['schedule_timer', 'cancel_timer'])
const FORWARD_TOOLS  = new Set(['write_memory', 'propose_constraint', 'view_recipe', 'write_session_note'])

async executeToolCall(name: string, args: unknown): Promise<unknown> {
  if (DIRECT_TOOLS.has(name)) {
    return this.executeDirectly(name, args)
  }
  if (FORWARD_TOOLS.has(name)) {
    return this.forwardToolToBrain(name, args)
  }
  throw new Error(`Unknown tool: ${name}`)
}
```

**Direct tools** (handled by Mira session runtime itself):
- `schedule_timer` — writes to DO alarm, updates `scheduled_alarms` table
- `cancel_timer` — clears DO alarm, updates `scheduled_alarms` table

**Forwarded tools** (handled by Brain DO via SQLite):
- `write_memory` → calls `write_user_memory` tool on Brain
- `propose_constraint` → calls `propose_user_constraint` tool on Brain
- `view_recipe` → calls `view_user_recipe` tool on Brain
- `write_session_note` → logs to `memory_event` on Brain

---

## Tool Execution — Direct (Timer Example)

```typescript
private async executeDirectly(name: string, args: unknown): Promise<unknown> {
  const typedArgs = args as Record<string, unknown>

  switch (name) {
    case 'schedule_timer': {
      const { label, seconds } = typedArgs as { label: string; seconds: number }
      const alarmId = await this.scheduleTimer(label, seconds)
      return { success: true, alarm_id: alarmId, fires_in_seconds: seconds }
    }
    case 'cancel_timer': {
      const { label } = typedArgs as { label: string }
      await this.cancelTimer(label)
      return { success: true, cancelled: label }
    }
    default:
      throw new Error(`Not a direct tool: ${name}`)
  }
}
```

---

## Tool Execution — Forward to Brain

```typescript
private async forwardToolToBrain(name: string, args: unknown): Promise<unknown> {
  const brainId = this.env.BRAIN.idFromName(this.sessionState.userId)
  const brain   = this.env.BRAIN.get(brainId)

  // Map Mira in cooking role tool names to Brain tool names
  const toolMap: Record<string, string> = {
    write_memory:      'write_user_memory',
    propose_constraint: 'propose_user_constraint',
    view_recipe:       'view_user_recipe',
    write_session_note: 'log_memory_event',
  }

  const brainToolName = toolMap[name]
  if (!brainToolName) throw new Error(`No mapping for tool: ${name}`)

  // Add sessionId context for write_session_note
  const enrichedArgs = name === 'write_session_note'
    ? {
        event_type: 'session_note',
        source:     'cooking_agent',
        content:    JSON.stringify({ note: (args as { note: string }).note }),
        session_id: this.sessionState.sessionId,
      }
    : args

  const resp = await brain.fetch('/internal/tool-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.DO_INTERNAL_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      caller:  'cooking',
      tool:    brainToolName,
      args:    enrichedArgs,
      session: this.sessionState.sessionId,
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Brain tool failed: ${resp.status} ${body}`)
  }

  return resp.json()
}
```

---

## What Gemini Sees — Tool Result Format

Gemini receives a `tool_response` after every tool call. The response must be a JSON-serializable object. Gemini reads it and uses it to inform its next audio response.

Good tool result (timer set):
```json
{ "success": true, "alarm_id": "abc123", "fires_in_seconds": 600 }
```

Good tool result (memory written):
```json
{ "success": true, "id": "diet.preferences:no_oil", "action": "updated" }
```

Good tool result (recipe loaded):
```json
{
  "title": "Doro Wat",
  "content": "...",
  "last_cooked": "2025-11-12",
  "cook_count": 4
}
```

Error result (tool failed — Gemini can acknowledge and move on):
```json
{ "error": "Timer already exists with this label" }
```

---

## Tool Permissions Summary

| Tool | Caller | Executed By |
|---|---|---|
| `schedule_timer` | Mira session runtime | Mira session runtime (direct) |
| `cancel_timer` | Mira session runtime | Mira session runtime (direct) |
| `write_session_note` | Mira session runtime | Brain DO → `log_memory_event` |
| `write_memory` | Mira session runtime | Brain DO → `write_user_memory` |
| `propose_constraint` | Mira session runtime | Brain DO → `propose_user_constraint` |
| `view_recipe` | Mira session runtime | Brain DO → `view_user_recipe` |

No tool in the cooking session can delete rows, confirm constraints, archive skills, or touch any other user's data. The `TOOL_PERMISSIONS` map in the Brain enforces this at execution time regardless of what the agent requests.
