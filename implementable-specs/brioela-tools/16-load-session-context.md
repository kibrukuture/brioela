# Tool: load_session_context

## Purpose

`load_session_context` assembles the previous session's outcome and relevant carry-over context at the start of a new session. It is the bridge between sessions — without it, every session starts cold with no memory of what just happened.

This tool is called ONCE per session: at session start, before the first user turn is processed. It is not called mid-session. The agent reads what it returns, uses it to hydrate context (reminders to the user, pending followups, outstanding alarms), and then proceeds with the session.

What it reads is carefully bounded. The goal is continuity, not a full replay of history. Loading too much is as dangerous as loading too little — a 20-session dump does not help the agent; it buries the signal.

## When to Call It

Call `load_session_context` exactly once:
- At the start of every new `chat` session
- At the start of every new `cooking` session, before loading the recipe
- At the start of every `alarm` session spawned by the DO alarm handler

Do NOT call `load_session_context`:
- Mid-session — context is already loaded
- More than once per session
- In `background` sessions where the Brain maintenance or behavior pattern detection runs — those sessions read what they need directly

## Input Schema

```typescript
import { z } from 'zod'

export const LoadSessionContextSchema = z.object({
  current_session_id: z.string().uuid(),
  // The session row that was just created for this session.
  // The tool uses this to exclude the current session from "previous session" queries.

  limit_recent_sessions: z.number().int().min(1).max(5).default(3),
  // How many recent completed sessions to include outcome summaries for.
  // Default is 3 — enough continuity without overwhelming context.
  // Increase to 5 for alarm sessions that need deeper history to act correctly.
  // Never exceed 5 — if the agent needs deeper history, use search_session_history.
})
```

## What It Reads — Bounded and Ordered

### 1. Most Recent Completed Session

The single most recent session with `status = 'completed'` and `ended_at IS NOT NULL`, excluding the current session:

```typescript
const lastSession = db.select({
  id:             sessions.id,
  sessionType:    sessions.sessionType,
  outcomeSummary: sessions.outcomeSummary,
  recipeId:       sessions.recipeId,
  endedAt:        sessions.endedAt,
  endReason:      sessions.endReason,
  model:          sessions.model,
})
.from(sessions)
.where(
  and(
    eq(sessions.status, 'completed'),
    isNotNull(sessions.endedAt),
    ne(sessions.id, input.current_session_id)
  )
)
.orderBy(desc(sessions.endedAt))
.limit(1)
.get()
```

This is the most important read. The previous session's `outcome_summary` tells the agent what happened, what was written to memory, what was left open.

### 2. Recent Session Summaries (up to limit_recent_sessions)

```typescript
const recentSessions = db.select({
  id:             sessions.id,
  sessionType:    sessions.sessionType,
  outcomeSummary: sessions.outcomeSummary,
  endedAt:        sessions.endedAt,
})
.from(sessions)
.where(
  and(
    eq(sessions.status, 'completed'),
    isNotNull(sessions.outcomeSummary),
    ne(sessions.id, input.current_session_id)
  )
)
.orderBy(desc(sessions.endedAt))
.limit(input.limit_recent_sessions)
.all()
```

`outcome_summary` only — not full turn transcripts. If the agent needs full turns from a specific session, it reads `session_turns` directly. This tool never loads turn-level data.

### 3. Pending Alarms

Alarms that are still pending — things the agent scheduled and the user should know about:

```typescript
const pendingAlarms = db.select({
  id:          scheduledAlarms.id,
  alarmType:   scheduledAlarms.alarmType,
  scheduledFor: scheduledAlarms.scheduledFor,
  payloadJson: scheduledAlarms.payloadJson,
})
.from(scheduledAlarms)
.where(eq(scheduledAlarms.status, 'pending'))
.orderBy(asc(scheduledAlarms.scheduledFor))
.all()
```

The agent uses this to surface active reminders: "you have a sickness followup set for tomorrow morning."

### 4. Active Memory Namespaces

All distinct `namespace` values currently in `user_memory` for this user. This is how the agent knows what namespaces already exist before writing any new fact.

```typescript
const namespaces = db.selectDistinct({ namespace: userMemory.namespace })
  .from(userMemory)
  .where(eq(userMemory.isActive, true))
  .orderBy(asc(userMemory.namespace))
  .all()
  .map(r => r.namespace)

// Result: ["diet", "diet.preferences", "family", "health", "health.medications", "life.places"]
```

Only active namespaces (`isActive = true`) are returned. Deactivated entries belong to stale namespaces that may no longer be relevant. The agent should not write new facts into a namespace where all entries are deactivated.

This query is cheap — it is a single `SELECT DISTINCT` with an index on `(is_active, namespace)` and the result is at most 40 strings.

### 5. Last Abandoned Session Warning

If the most recent session has `status = 'abandoned'`, flag it — the user may not know their last session ended unexpectedly:

```typescript
const lastAbandoned = db.select({
  id:        sessions.id,
  endedAt:   sessions.endedAt,
  sessionType: sessions.sessionType,
})
.from(sessions)
.where(
  and(
    eq(sessions.status, 'abandoned'),
    ne(sessions.id, input.current_session_id)
  )
)
.orderBy(desc(sessions.startedAt))
.limit(1)
.get()
```

If `lastAbandoned.endedAt` is recent (within 24 hours), the agent should acknowledge it: "looks like our last session ended unexpectedly — want to pick up where we left off?"

## What It Returns

```json
{
  "last_session": {
    "id": "prev-session-uuid",
    "session_type": "cooking",
    "outcome_summary": "Cooked doro wat with grandma. Captured egg-marbling technique. Updated recipe. Grandma mentioned adding more berbere next time.",
    "recipe_id": "recipe-uuid",
    "ended_at": 1748390400000,
    "end_reason": "completed"
  },
  "recent_sessions": [
    {
      "id": "...",
      "session_type": "chat",
      "outcome_summary": "User asked about travel to Addis. Scheduled travel_preload alarm for June 10.",
      "ended_at": 1748304000000
    }
  ],
  "pending_alarms": [
    {
      "id": "alarm-uuid",
      "alarm_type": "travel_preload",
      "scheduled_for": 1748736000000,
      "payload": { "destination": "Addis Ababa" }
    }
  ],
  "last_abandoned_session": null,
  "memory_namespaces": ["diet", "diet.preferences", "family", "health", "health.medications", "life.places"]
}
```

`last_session` is always the single most recent completed session, even if it is also included in `recent_sessions`. The agent uses `last_session` for immediate continuity and `recent_sessions` for broader context.

If there is no previous session (first ever session for this user), `last_session` is `null` and `recent_sessions` is `[]`.

## What the Agent Does With This

After receiving the response, the agent:

1. Reads `last_session.outcome_summary` — incorporates this into the system prompt context for the current session (or opens with an acknowledgment of what happened last time)
2. Reads `pending_alarms` — surfaces relevant alarms to the user if they are upcoming and worth mentioning
3. If `last_abandoned_session` is recent — acknowledges the unexpected end, offers to continue
4. Reads `memory_namespaces` — holds this list in context for the entire session. Every time it calls `write_user_memory`, it checks this list first. If a suitable namespace already exists, it writes there. If it creates a new namespace, it adds that name to its in-context list so subsequent writes in the same session remain consistent.
5. Does NOT read `session_turns` for the previous session unless the user or a specific tool use requires it — outcome_summary is the summary, not the transcript

## Side Effects

None. Pure reads. Nothing is written.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Invalid UUID, limit out of range | Zod error with failing field |
| Read failure | SQLite error (rare) | Error message |

No `found: false` case — if there are no prior sessions, the response is valid with `null` and empty arrays.

## Who Can Call It

- **Agent** — once per session, at session start
- **NOT the Brain maintenance** — reads its own state directly
- **NOT device SDK**

## What Is NOT This Tool's Job

- Loading full turn transcripts → read `session_turns` directly if needed
- Searching past sessions by keyword → `search_session_history`
- Loading the user's memory, skills, constraints, or personality → injected into the system prompt automatically; not loaded through tools
- Loading recipe details → `view_user_recipe`
