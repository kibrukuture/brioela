# Brain — Session Lifecycle

## What This File Covers

Session open, system prompt construction (BrioelaIdentity + order), compression triggers, SessionContextCompressor sub-agent, abandoned session detection, and the watchdog alarm.

---

## Session Open

When a user initiates any interaction, a session row is created in the `sessions` table and the system prompt is assembled once for the lifetime of that session.

```typescript
// backend/src/agents/brain/_handlers/session.handler.ts

export async function openSession(
  db: DrizzleDB,
  userId: string,
  sessionType: 'chat' | 'cooking' | 'alarm' | 'background',
): Promise<{ sessionId: string; systemPrompt: string }> {
  const sessionId = crypto.randomUUID()

  db.insert(sessions).values({
    id:          sessionId,
    userId,
    sessionType,
    status:      'active',
    inputTokens: 0,
    turnCount:   0,
    startedAt:   Date.now(),
  }).run()

  // Set watchdog alarm — detects abandoned sessions
  // If session is still 'active' when this fires, it was abandoned
  const WATCHDOG_MS = sessionType === 'cooking' ? 4 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000
  await db.insert(scheduledAlarms).values({
    id:          crypto.randomUUID(),
    type:        'session_watchdog',
    payload:     JSON.stringify({ sessionId }),
    scheduledAt: Date.now() + WATCHDOG_MS,
    status:      'pending',
  }).run()

  const systemPrompt = await buildSystemPrompt(db, sessionType, userId)
  return { sessionId, systemPrompt }
}
```

---

## System Prompt Construction — Order Is Not Optional

The order of blocks in the system prompt is governed by Anthropic's prefix caching. Static content must appear before dynamic content. Any deviation invalidates the cache prefix and the static block is billed at full cost on every turn.

```typescript
// backend/src/agents/brain/_handlers/system-prompt.builder.ts

import { BrioelaIdentity } from '../identity-prompt'                     // 800-token constant string
import type { DrizzleDB } from '@/types/db'

export async function buildSystemPrompt(
  db: DrizzleDB,
  sessionType: 'chat' | 'cooking' | 'alarm' | 'background',
  userId: string,
): Promise<string> {
  const blocks: string[] = []

  // Block 1 — BrioelaIdentity (universal, never changes per user, never changes per session)
  blocks.push(BrioelaIdentity)

  // Block 2 — constraints (safety-critical — always complete, always near top)
  const hardConstraints = db.select().from(constraints)
    .where(eq(constraints.status, 'confirmed'))
    .all()
  if (hardConstraints.length > 0) {
    blocks.push(formatConstraints(hardConstraints))
  }

  // Block 3 — user_personality (active traits, ordered by strength DESC)
  const traits = db.select().from(userPersonality)
    .where(eq(userPersonality.status, 'active'))
    .orderBy(desc(userPersonality.strength))
    .all()
  if (traits.length > 0) {
    blocks.push(formatPersonality(traits))
  }

  // Block 4 — user_memory (relevant namespaces for this session type)
  const relevantNamespaces = getRelevantNamespaces(sessionType)
  const memories = db.select().from(userMemory)
    .where(inArray(userMemory.namespace, relevantNamespaces))
    .all()
  if (memories.length > 0) {
    blocks.push(formatMemory(memories))
  }

  // Block 5 — skills index (name + description only — content loaded on demand via view_user_skill)
  const activeSkills = db.select({ name: skills.name, description: skills.description })
    .from(skills)
    .where(eq(skills.status, 'active'))
    .all()
  if (activeSkills.length > 0) {
    blocks.push(formatSkillsIndex(activeSkills))
  }

  // Block 6 — previous session outcome_summary (most recent completed session)
  const lastSession = db.select({ outcomeSummary: sessions.outcomeSummary })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
    .orderBy(desc(sessions.endedAt))
    .limit(1)
    .get()
  if (lastSession?.outcomeSummary) {
    blocks.push(`## Previous Session\n${lastSession.outcomeSummary}`)
  }

  // Conversation turns come AFTER all of the above — never interleaved into the static prefix
  return blocks.join('\n\n---\n\n')
}

function getRelevantNamespaces(sessionType: string): string[] {
  if (sessionType === 'cooking') {
    return ['health', 'cooking', 'life.dietary', 'health.medications']
  }
  return ['health', 'life', 'cooking.preferences']
}
```

---

## Compression

### When Compression Triggers

Checked before processing each new user turn. Whichever threshold hits first:

| Session type | Turn threshold | Token threshold |
|---|---|---|
| `chat` | 40 turns | 60,000 input_tokens |
| `cooking` | 80 turns | 100,000 input_tokens |
| `alarm` | N/A | N/A |
| `background` | N/A | N/A |

```typescript
// backend/src/agents/brain/_handlers/session.handler.ts

export async function checkCompressionNeeded(
  db: DrizzleDB,
  sessionId: string,
): Promise<boolean> {
  const session = db.select({
    inputTokens:  sessions.inputTokens,
    turnCount:    sessions.turnCount,
    sessionType:  sessions.sessionType,
  }).from(sessions).where(eq(sessions.id, sessionId)).get()

  if (!session) return false

  const TURN_THRESHOLD  = session.sessionType === 'cooking' ? 80  : 40
  const TOKEN_THRESHOLD = session.sessionType === 'cooking' ? 100_000 : 60_000

  return session.turnCount >= TURN_THRESHOLD || session.inputTokens >= TOKEN_THRESHOLD
}
```

Compression runs BEFORE the new user turn is processed. The new turn goes into the new (post-compression) session.

---

### SessionContextCompressor

SessionContextCompressor is an ephemeral sub-agent DO. It receives all turns from the current session, reasons over them, and returns a four-field structured summary. It calls no tools — pure reasoning with structured output.

```typescript
// backend/src/agents/brain/_handlers/session.handler.ts

const CompressionSummarySchema = z.object({
  intent:       z.string().min(1).max(500),
  accomplished: z.string().min(1).max(1000),
  decisions:    z.string().max(500).default(''),
  continuing:   z.string().max(500).default(''),
})

export async function runCompression(
  db: DrizzleDB,
  env: Env,
  sessionId: string,
  userId: string,
): Promise<void> {
  // Collect all turns for this session
  const turns = db.select().from(sessionTurns)
    .where(eq(sessionTurns.sessionId, sessionId))
    .orderBy(asc(sessionTurns.turnNumber))
    .all()

  // Spin up SessionContextCompressor DO — ephemeral, dies when work is done
  const compressorId = env.BRAIN.idFromName(`compressor_${userId}_${sessionId}`)
  const compressorStub = env.BRAIN.get(compressorId)

  const { object: summary } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),  // fast + cheap for compression
    schema: CompressionSummarySchema,
    system: COMPRESSOR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: formatTurnsForCompression(turns) }],
  })

  // Write compression summary into old session
  db.update(sessions)
    .set({
      status:            'compressed',
      compressionSummary: JSON.stringify(summary),
      endedAt:           Date.now(),
    })
    .where(eq(sessions.id, sessionId))
    .run()

  // Create new child session — continues from where the old one stopped
  const newSessionId = crypto.randomUUID()
  db.insert(sessions).values({
    id:              newSessionId,
    userId,
    sessionType:     'chat',
    status:          'active',
    parentSessionId: sessionId,   // links the chain
    inputTokens:     0,
    turnCount:       0,
    startedAt:       Date.now(),
  }).run()
}

const COMPRESSOR_SYSTEM_PROMPT = `
You are Brioela's session compressor. A session has grown too long to continue in full.
Read ALL the turns below and produce a structured four-field summary that lets the session
continue naturally without losing thread.

Rules:
- Be specific and user-specific — not generic descriptions
- Capture technique details, exact decisions, what was said that mattered
- Do NOT include everything — only what the agent needs to continue from here
- Keep each field tight: intent ≤500 chars, accomplished ≤1000 chars, decisions ≤500 chars, continuing ≤500 chars
- Output valid JSON matching the schema exactly
`
```

---

## Session Close — Writing the Outcome Summary

When a session ends cleanly, an `outcome_summary` is written to the sessions row. This is what gets injected into the next session's system prompt as Block 6.

```typescript
export async function closeSession(
  db: DrizzleDB,
  sessionId: string,
  outcomeSummary: string,
): Promise<void> {
  db.update(sessions)
    .set({
      status:         'completed',
      outcomeSummary,
      endedAt:        Date.now(),
    })
    .where(eq(sessions.id, sessionId))
    .run()

  // Cancel the watchdog alarm that was set at session open
  db.update(scheduledAlarms)
    .set({ status: 'cancelled' })
    .where(and(
      eq(scheduledAlarms.type, 'session_watchdog'),
      eq(scheduledAlarms.status, 'pending'),
      sql`json_extract(payload, '$.sessionId') = ${sessionId}`,
    ))
    .run()
}
```

---

## Abandoned Session Detection — Watchdog Alarm

At session open, a watchdog alarm is set (2h for chat, 4h for cooking). When the watchdog fires and the session is still `active`, it was abandoned — the app crashed, the network dropped, the user closed without finishing.

```typescript
// backend/src/agents/brain/_handlers/alarm.handler.ts

case 'session_watchdog': {
  const { sessionId } = JSON.parse(alarm.payload) as { sessionId: string }

  const session = db.select({ status: sessions.status, turnCount: sessions.turnCount })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .get()

  if (!session || session.status !== 'active') {
    // Session already closed cleanly — nothing to do
    break
  }

  // Session is abandoned — mark it with what we have
  const summary = session.turnCount > 0
    ? 'Session ended without a clean close. Partial conversation occurred.'
    : 'Session abandoned before any turns.'

  db.update(sessions)
    .set({ status: 'abandoned', outcomeSummary: summary, endedAt: Date.now() })
    .where(eq(sessions.id, sessionId))
    .run()

  break
}
```

Abandoned sessions do not block the user. The next session starts fresh — the abandoned session's `outcomeSummary` is brief and does not inject false context.
