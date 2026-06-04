# Spec: Session Lifecycle — Compression and Abandoned Detection

## Why This Spec Exists

Two session lifecycle events have no implementation path in any other spec:

1. **Compression** — a long session exceeds context limits. The session must continue without losing the conversation thread. How does this happen, who does it, what does it produce?

2. **Abandoned detection** — a session ends uncleanly (app crash, network drop, device shutdown). Nobody called a proper close. The session row sits at `status = 'active'` forever. Who detects this and fixes it?

Both mechanisms are critical for production correctness. A system with unbounded session growth collapses under long cooking sessions. A system with stuck `active` rows gives every future session a false "you have an active session" signal that blocks the Curator from running.

---

## Part 1 — Session Compression

### The Problem

A 2-hour cooking session with grandma generates 80–150 turns. Each turn is in `session_turns`. The agent's context window accumulates all of them plus the system prompt (SOUL, user_memory, skills index, constraints, personality). At some point the context fills and the model cannot continue.

The naive solution — truncate old turns — loses conversational continuity. The agent forgets what grandma said about the spice order 40 minutes ago.

The correct solution — compress old turns into a structured summary, start a new session, continue with the summary + recent turns. The raw turns are preserved in `session_turns` under the old `session_id`. Nothing is deleted. The `parent_session_id` chain links old and new. History is fully traversable.

### Why Brioela's Compression Is Lighter Than Most Systems

Most AI systems treat compression as a preservation problem — they must compress because they have no external memory. Brioela already has external memory. Every significant fact from the first 60 turns of a cooking session has already been extracted:
- Ingredient mentions → `log_memory_event` logged them
- Technique learned → `update_user_skill` or `create_user_skill` called
- User preferences noted → `write_user_memory` written
- Constraint surfaced → `propose_user_constraint` called

By the time compression triggers, the structured information is already in SQLite. The compression summary does not need to be exhaustive — it needs to give the agent an anchor to continue the conversation thread naturally. The four-field structure is sufficient.

---

### Compression Triggers — Both Thresholds, Whichever Hits First

| Session type | Turn threshold | Token threshold |
|---|---|---|
| `chat` | 40 turns | 60,000 `input_tokens` on the sessions row |
| `cooking` | 80 turns | 100,000 `input_tokens` on the sessions row |
| `alarm` | N/A — these sessions are short by design | N/A |
| `background` | N/A | N/A |

The Orchestrator checks both before processing each new user turn:

```typescript
const session = db.select({
  inputTokens: sessions.inputTokens,
  turnCount:   sessions.turnCount,
  sessionType: sessions.sessionType,
})
.from(sessions)
.where(eq(sessions.id, currentSessionId))
.get()

const TURN_THRESHOLD  = session.sessionType === 'cooking' ? 80  : 40
const TOKEN_THRESHOLD = session.sessionType === 'cooking' ? 100_000 : 60_000

const compressionNeeded =
  session.turnCount   >= TURN_THRESHOLD ||
  session.inputTokens >= TOKEN_THRESHOLD

if (compressionNeeded) {
  await runCompression(currentSessionId)
}
```

Compression always runs BEFORE the new user turn is processed — not after. The new turn goes into the new (post-compression) session, not the old one.

---

### CompressorAgent — Architecture

CompressorAgent is a sub-agent DO spun up by the Orchestrator when compression triggers. It is architecturally identical to all other sub-agents — ephemeral DO, dies when done.

```
key: idFromName(`compressor_${userId}_${sessionId}`)
```

**Key difference from CuratorAgent and PatternDetectionAgent**: CompressorAgent does NOT need tool forwarding. Its input is fixed and bounded — the Orchestrator collects all turns from `session_turns` and passes them as context. CompressorAgent reasons over what it receives and returns structured output. No fetching, no tool calls.

```
Orchestrator:
1. Reads ALL turns for current session from session_turns ORDER BY turn_number ASC
2. Spins up CompressorAgent DO
3. Passes turns as context
4. CompressorAgent returns four-field summary (structured JSON)
5. Orchestrator applies compression (writes, creates new session)
6. CompressorAgent dies
```

This is a pure reasoning task. The agent that has been in the session for 80 turns is the best summarizer of what happened — it has full context. CompressorAgent receives that full context and distills it.

**Tool permission for CompressorAgent in the Orchestrator's TOOL_PERMISSIONS table:**
```typescript
compressor: []   // no tool calls — pure reasoning, structured output returned directly
```

---

### CompressorAgent System Prompt

```
You are Brioela's session compressor. A cooking/chat session has grown too long
to continue in full. Your job: read ALL the turns below and produce a structured
four-field summary that lets the session continue naturally without losing thread.

Rules:
- Be specific and user-specific — not generic descriptions
- Capture technique details, exact decisions, what grandma said that mattered
- Do NOT include everything — only what the agent needs to continue from here
- Keep each field tight: intent ≤500 chars, accomplished ≤1000 chars, decisions ≤500 chars, continuing ≤500 chars
- Output valid JSON matching the schema exactly

Output schema:
{
  "intent":       string,   // what is this session trying to accomplish?
  "accomplished": string,   // what has already happened / been completed / been learned?
  "decisions":    string,   // key choices made — substitutions, corrections, preferences stated
  "continuing":   string    // what remains to be done in this session?
}
```

**Example output for a doro wat cooking session mid-way:**

```json
{
  "intent": "Cooking doro wat with grandma — learning her technique and capturing it for the recipe",
  "accomplished": "Onions caramelized 40 min (longer than user expected). Berbere added at stage 2 not stage 1 — grandma corrected this. Niter kibbeh in. Chicken browned. Sauce currently reducing.",
  "decisions": "Less berbere than grandma suggested — user's heat preference confirmed. Skipped cardamom this time (user doesn't like it). Grandma said eggs go in at the very end — not mid-cook.",
  "continuing": "Sauce needs another 20 min. Add eggs for marbling. Final salt check. Recipe notes to capture after session."
}
```

---

### Zod Schema for Compression Summary

```typescript
import { z } from 'zod'

export const CompressionSummarySchema = z.object({
  intent:       z.string().min(1).max(500),
  accomplished: z.string().min(1).max(1000),
  decisions:    z.string().max(500).default(''),
  continuing:   z.string().max(500).default(''),
})
```

---

### What the Orchestrator Does After CompressorAgent Returns

```typescript
async function applyCompression(
  oldSessionId: string,
  summary: CompressionSummary,
  last10Turns: SessionTurn[]
) {
  const now = Date.now()
  const newSessionId = crypto.randomUUID()

  db.transaction(() => {
    // 1. Mark old session as compressed
    db.update(sessions)
      .set({
        status:         'compressed',
        outcomeSummary: JSON.stringify(summary),   // four-field summary
        endedAt:        now,
        endReason:      'compressed',
        updatedAt:      now,
      })
      .where(eq(sessions.id, oldSessionId))
      .run()

    // 2. Create new continuation session
    const oldSession = db.select().from(sessions).where(eq(sessions.id, oldSessionId)).get()
    db.insert(sessions).values({
      id:               newSessionId,
      userId:           ctx.userId,
      sessionType:      oldSession.sessionType,
      parentSessionId:  oldSessionId,           // ← compression chain link
      recipeId:         oldSession.recipeId,
      alarmType:        null,
      status:           'active',
      outcomeSummary:   null,
      model:            oldSession.model,
      inputTokens:      0,
      outputTokens:     0,
      cacheReadTokens:  0,
      cacheWriteTokens: 0,
      turnCount:        0,
      skillsCreated:    0,
      constraintsProposed: 0,
      memoryWrites:     0,
      startedAt:        now,
      endedAt:          null,
      endReason:        null,
    })
  })

  // Return: new session id + the context the agent continues with
  return {
    newSessionId,
    compressionSummary: summary,
    recentTurns: last10Turns,   // last 10 turns verbatim from old session
  }
}
```

---

### Continuing Session — Context Structure

The agent continues the conversation in the new session with this system prompt structure (in addition to the standard SOUL + user context blocks):

```
[SOUL]
[user_memory, skills index, constraints, personality — unchanged]

[CONTINUATION CONTEXT — session was compressed]
Earlier in this session (summary):
  Intent:       {summary.intent}
  Accomplished: {summary.accomplished}
  Decisions:    {summary.decisions}
  Continuing:   {summary.continuing}

[Last 10 turns verbatim from previous session]
turn 71 [user]: ...
turn 72 [assistant]: ...
...
turn 80 [user]: ...   ← last turn before compression

[Current session continues from here]
```

The agent does not announce to the user that compression happened. From the user's perspective the conversation is uninterrupted. The agent knows it has a summary of "earlier" plus the last 10 turns — exactly enough to continue naturally.

**Why 10 turns verbatim**: Industry pattern from Mem0. 5 full exchanges (user + agent). Enough for conversational continuity — the agent knows what was just said, what it just responded, what tool calls just ran. Less than 10 and continuity breaks. More than 10 and the purpose of compression is defeated.

---

### Traversing the Compression Chain

To reconstruct the full history of a long cooking session:

```typescript
async function getFullSessionChain(sessionId: string): Promise<Session[]> {
  const chain: Session[] = []
  let currentId: string | null = sessionId

  while (currentId) {
    const session = db.select()
      .from(sessions)
      .where(eq(sessions.id, currentId))
      .get()

    if (!session) break
    chain.unshift(session)              // prepend — oldest first
    currentId = session.parentSessionId // walk the chain
  }

  return chain   // [oldest → newest]
}
```

All turns from all sessions in the chain give the complete transcript. `session_turns WHERE session_id IN (chain_ids) ORDER BY session start, turn_number ASC`.

---

## Part 2 — Abandoned Session Detection

### The Problem

A session ends uncleanly: app crashes, phone dies, network drops mid-cooking-session. The session row stays at `status = 'active'` indefinitely. Every subsequent session start sees an "active session exists" flag from the Orchestrator's active session check. The Curator defers indefinitely. `load_session_context` returns stale context.

This needs a concrete detection mechanism. Nothing in the current spec detects it.

### The Mechanism — session_watchdog Alarm

When ANY session starts (chat, cooking, alarm, background), the Orchestrator inserts a `session_watchdog` alarm into `scheduled_alarms`:

```typescript
db.insert(scheduledAlarms).values({
  id:                 crypto.randomUUID(),
  userId:             ctx.userId,
  alarmType:          'session_watchdog',
  status:             'pending',
  scheduledFor:       now + WATCHDOG_DURATION[session.sessionType],
  payloadJson:        JSON.stringify({ session_id: session.id }),
  triggeringSessionId: session.id,
  attempts:           0,
  createdAt:          now,
  updatedAt:          now,
})
```

**Watchdog durations by session type:**

| Session type | Watchdog fires after |
|---|---|
| `chat` | 2 hours from session start |
| `cooking` | 8 hours from session start |
| `alarm` | 1 hour from session start |
| `background` | 1 hour from session start |

These are generous — a legitimate 4-hour grandma cooking session does not trigger the 8-hour watchdog. The watchdog catches truly stuck sessions, not long but active ones.

### What Happens When the Watchdog Fires

The DO alarm handler wakes up, finds the `session_watchdog` row due, and runs:

```typescript
async function handleSessionWatchdog(alarm: ScheduledAlarm) {
  const payload    = JSON.parse(alarm.payloadJson) as { session_id: string }
  const session    = db.select().from(sessions)
                      .where(eq(sessions.id, payload.session_id)).get()

  // If session already closed cleanly — no-op
  if (!session || session.status !== 'active') return

  // Check last turn timestamp
  const lastTurn = db.select({ createdAt: sessionTurns.createdAt })
    .from(sessionTurns)
    .where(eq(sessionTurns.sessionId, payload.session_id))
    .orderBy(desc(sessionTurns.turnNumber))
    .limit(1)
    .get()

  const INACTIVITY_THRESHOLD: Record<string, number> = {
    chat:       30  * 60 * 1000,   // 30 minutes
    cooking:    60  * 60 * 1000,   // 1 hour
    alarm:      15  * 60 * 1000,   // 15 minutes
    background: 15  * 60 * 1000,   // 15 minutes
  }

  const threshold = INACTIVITY_THRESHOLD[session.sessionType]
  const lastActivity = lastTurn?.createdAt ?? session.startedAt
  const timeSinceActivity = Date.now() - lastActivity

  if (timeSinceActivity >= threshold) {
    // Truly abandoned — mark it
    db.update(sessions)
      .set({
        status:         'abandoned',
        endedAt:        Date.now(),
        endReason:      'timeout',
        outcomeSummary: buildAbandonedSummary(session, lastTurn),
        updatedAt:      Date.now(),
      })
      .where(eq(sessions.id, payload.session_id))
      .run()
  } else {
    // Session is still active and recent — reschedule watchdog for 1 more hour
    db.insert(scheduledAlarms).values({
      id:                 crypto.randomUUID(),
      userId:             ctx.userId,
      alarmType:          'session_watchdog',
      status:             'pending',
      scheduledFor:       Date.now() + 60 * 60 * 1000,
      payloadJson:        alarm.payloadJson,
      triggeringSessionId: payload.session_id,
      attempts:           0,
      createdAt:          Date.now(),
      updatedAt:          Date.now(),
    })
  }
}

function buildAbandonedSummary(session: Session, lastTurn: SessionTurn | null): string {
  const turnCount = session.turnCount
  const lastAt    = lastTurn
    ? new Date(lastTurn.createdAt).toISOString()
    : 'no turns recorded'
  return `Session ended unexpectedly (${session.sessionType}). ${turnCount} turns recorded. Last activity: ${lastAt}.`
}
```

### Cancelling the Watchdog on Clean Session Close

When a session ends cleanly (user closes app, cooking session finishes, alarm completes), the Orchestrator cancels the pending watchdog alarm:

```typescript
async function closeSession(sessionId: string, endReason: string, outcomeSummary: string) {
  // 1. Update the session row
  db.update(sessions)
    .set({ status: 'completed', endedAt: Date.now(), endReason, outcomeSummary })
    .where(eq(sessions.id, sessionId))
    .run()

  // 2. Cancel its watchdog alarm — it is no longer needed
  const watchdog = db.select()
    .from(scheduledAlarms)
    .where(
      and(
        eq(scheduledAlarms.alarmType, 'session_watchdog'),
        eq(scheduledAlarms.triggeringSessionId, sessionId),
        eq(scheduledAlarms.status, 'pending'),
      )
    )
    .get()

  if (watchdog) {
    db.update(scheduledAlarms)
      .set({ status: 'cancelled', updatedAt: Date.now() })
      .where(eq(scheduledAlarms.id, watchdog.id))
      .run()
    // Reset DO alarm slot to next earliest pending alarm
    const next = db.select({ scheduledFor: scheduledAlarms.scheduledFor })
      .from(scheduledAlarms)
      .where(eq(scheduledAlarms.status, 'pending'))
      .orderBy(asc(scheduledAlarms.scheduledFor))
      .limit(1).get()
    if (next) await this.ctx.storage.setAlarm(next.scheduledFor)
    else      await this.ctx.storage.deleteAlarm()
  }
}
```

### Interaction with Compression

When compression triggers mid-session:
1. The old session is marked `compressed` — its watchdog is cancelled (same `closeSession` logic)
2. The new (continuation) session is created with its own fresh watchdog alarm

The compression chain correctly maintains watchdog coverage across the session boundary.

---

## Summary — What Was Decided Here

| Decision | Value |
|---|---|
| Chat compression trigger | 40 turns OR 60,000 input tokens |
| Cooking compression trigger | 80 turns OR 100,000 input tokens |
| Verbatim turns kept after compression | Last 10 turns from old session |
| Compression summary format | Four-field: intent, accomplished, decisions, continuing |
| CompressorAgent tools | None — pure reasoning, structured output only |
| Watchdog: chat duration | 2 hours from session start |
| Watchdog: cooking duration | 8 hours from session start |
| Inactivity threshold: chat | 30 minutes since last turn |
| Inactivity threshold: cooking | 1 hour since last turn |
| On clean close | Cancel watchdog alarm immediately |
| On compression | Cancel old watchdog, new session gets fresh watchdog |
