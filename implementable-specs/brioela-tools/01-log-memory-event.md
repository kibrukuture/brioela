# Tool: log_memory_event

## Purpose

`log_memory_event` is the agent's only way to write a raw event into `memory_event`. It is the most foundational tool in the system. Almost everything downstream — `user_memory` facts, `user_personality` traits, `constraints` proposals — is eventually derived from events that were written through this tool.

The agent calls this when something durable happened that the system must remember. Not every conversation turn. Not every user message. Only things that represent a real-world event worth keeping: a food was eaten, a symptom was reported, a place was visited, a product was scanned mid-conversation, a pattern was observed.

Device events (product scans from the camera, receipt ingestion, barcode lookups) come through a separate DO HTTP endpoint from the device SDK — they do NOT go through this tool. This tool is for the agent to log what it observes or infers during a session.

## When to Call It

Call `log_memory_event` when:
- The user reports something that happened in the real world ("I felt sick after dinner last night")
- The agent observes a behavioral pattern worth logging ("user avoided this ingredient again")
- A session produces a durable outcome ("cooking session completed, dish was doro wat")
- A tool result reveals something worth keeping ("illness detective identified a likely cause")

Do NOT call `log_memory_event` for:
- Normal conversation turns — those go into `session_turns` automatically
- Facts already captured in `user_memory` — use `memory_update` for facts, not events
- Hypotheticals, preferences expressed casually, or things the user is uncertain about — only log things that actually happened

## Input Schema

```typescript
import { z } from 'zod'

export const LogMemoryEventSchema = z.object({
  kind: z.string().min(1),
  // What kind of event this is. Free text — no fixed enum.
  // Known values at launch: 'food_intake', 'symptom_reported', 'place_visited',
  // 'recipe_cooked', 'session_ended', 'behavior_pattern_observed', 'product_recalled',
  // 'illness_logged', 'travel_intent', 'visual_intake'
  // New kinds are added freely as the product grows.

  payload: z.record(z.unknown()),
  // The event data. What exactly happened. Structure is free — determined by kind.
  // Examples:
  //   kind='food_intake':      { food: "injera", context: "lunch" }
  //   kind='symptom_reported': { symptom: "nausea", onset: "30 minutes after eating", severity: "moderate" }
  //   kind='recipe_cooked':    { recipe_id: "uuid", dish: "doro wat", session_id: "uuid" }
  //   kind='behavior_pattern_observed': { pattern: "avoids peanuts", observation_count: 4 }

  captured_at: z.number().int().positive().optional(),
  // When the event actually occurred — unix timestamp ms.
  // Optional. If not provided, the system uses Date.now() (the event happened right now).
  // Provide this when the user is reporting something that happened in the past:
  //   "I felt sick last night" → captured_at = inferred timestamp for last night.

  source: z.string().min(1),
  // Who is logging this event. Free text.
  // For this tool: always 'agent' or 'background'.
  // 'device' events come through a separate DO endpoint, never through this tool.

  entity_kind: z.string().optional(),
  // What category of thing this event is about.
  // Examples: 'food', 'place', 'product', 'symptom', 'recipe'
  // Used for indexable queries: "all events about a specific food"

  entity_id: z.string().optional(),
  // The specific entity this event is about.
  // Examples: 'peanuts', 'barcode-1234567890', 'recipe-uuid'
  // Paired with entity_kind for cross-table lookups.

  geo_hash: z.string().optional(),
  // Geohash of where the event occurred — provided by the client if location is available.
  // Never fabricated by the agent. NULL if location not available or not relevant.
})
```

## What the System Fills In Automatically

These fields are NEVER passed in by the agent. The system sets them:

| Field | Value |
|---|---|
| `id` | `createId()` — generated at insert time |
| `user_id` | From DO context — the owner of this DO instance |
| `session_id` | From current active session context — NULL for background sessions |
| `ingested_at` | `Date.now()` — when the DO wrote the row, always now |

## What It Writes

One row inserted into `memory_event`. The insert is:

```typescript
db.insert(memoryEvent).values({
  id:          createId(),
  userId:      ctx.userId,
  kind:        input.kind,
  payloadJson: JSON.stringify(input.payload),
  capturedAt:  input.captured_at ?? Date.now(),
  ingestedAt:  Date.now(),
  source:      input.source,
  sessionId:   ctx.activeSessionId ?? null,
  entityKind:  input.entity_kind ?? null,
  entityId:    input.entity_id ?? null,
  geoHash:     input.geo_hash ?? null,
})
```

## What It Returns

On success, the tool returns the new event's UUID:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "logged"
}
```

The agent receives the `id` immediately. This matters because the agent may need to reference this event ID right away — for example, calling `propose_constraint` immediately after and including this event ID in the evidence array.

## Side Effects

None immediate.

Behavior behavior pattern detection and Brain maintenance runs are scheduled — they are not triggered per-event. Writing an event does not wake up the DO alarm or trigger any background job. The alarm system runs on its own schedule and reads `memory_event` in batch when it fires.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | `kind` is empty, `payload` is not an object, `captured_at` is not a valid timestamp | Zod error message with field that failed |
| Write failure | SQLite error (rare in DO) | Error message — agent should note the failure in the session but not retry aggressively |

## Who Can Call It

- **Agent** — during any active session (chat, cooking, alarm, background)
- **NOT the Brain maintenance** — the Brain maintenance reads `memory_event`, it never writes to it
- **NOT device SDK** — device events come through a separate DO HTTP endpoint

## What Is NOT This Tool's Job

- Writing structured facts → use `memory_update`
- Writing personality traits → Brain maintenance only, no tool
- Proposing constraints → use `propose_constraint`
- Scheduling future work → use `schedule_alarm`
- Logging conversation turns → automatic, not a tool call
