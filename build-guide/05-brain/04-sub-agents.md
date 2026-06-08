# Brain — Sub-Agents

## What This File Covers

The ephemeral sub-agent DO pattern, CuratorAgent, PatternDetectionAgent, the HTTP forwarding protocol for tool calls, and caller-based authorization.

---

## The Pattern — Ephemeral DOs, Permanent Brain

All agents in Brioela are Cloudflare Durable Objects. What separates them is the ID they are keyed by:

```
BrioelaBrain
  key: idFromName(userId)                                ← PERMANENT — same instance forever
  has: SQLite (the user's brain)
  never dies
  │
  ├── on curator_run alarm:
  │   spawns CuratorAgent
  │   key: idFromName(`curator_${userId}_${runId}`)      ← EPHEMERAL — new ID each run
  │   no SQLite — all writes forwarded to Brain
  │   dies when work is done
  │
  └── on pattern_detection alarm:
      spawns PatternDetectionAgent
      key: idFromName(`pattern_${userId}_${runId}`)      ← EPHEMERAL — new ID each run
      no SQLite — all writes forwarded to Brain
      dies when work is done
```

Sub-agents do not have SQLite. They cannot persist anything directly. Every read of structured data and every write must go through the Brain's `/internal/tool-call` endpoint. The Brain executes the tool against its SQLite and returns the result.

**Tools are defined once and executed once — always in the Brain.**

---

## CuratorAgent — Background Maintenance

### Schedule

Fires via an Agents SDK schedule on a 7-day interval. Before running, the Brain checks whether the user has been idle (no sessions in the last 2 hours). If the user is in an active session, the curator run is rescheduled 2 hours later — it never interrupts a live session.

```typescript
// In alarm.handler.ts — CURATOR_RUN alarm case

case 'curator_run': {
  // Check idle: no active session in last 2 hours
  const recentSession = db.select().from(sessions)
    .where(and(
      eq(sessions.status, 'active'),
      gt(sessions.startedAt, Date.now() - 2 * 60 * 60 * 1000),
    )).get()

  if (recentSession) {
    // User active — reschedule 2 hours later
    await scheduleUserAlarm({
      alarmType: 'curator_run',
      payload: { userId },
      scheduledAt: Date.now() + 2 * 60 * 60 * 1000,
      label: 'Curator run deferred while user is active',
    })
    return
  }

  const runId = crypto.randomUUID()
  const curatorId = env.BRAIN.idFromName(`curator_${userId}_${runId}`)
  const curatorStub = env.BRAIN.get(curatorId)
  await curatorStub.fetch(new Request('https://internal/run', { method: 'POST' }))

  // Reschedule next curator run — 7 days
  await scheduleUserAlarm({
    alarmType: 'curator_run',
    payload: { userId },
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    label: 'Weekly curator run',
  })
  break
}
```

### Three Passes

CuratorAgent runs three passes in order, each using the HTTP tool-forwarding protocol:

**Pass 1 — Skill Maintenance**
Reads all active skills. For each skill: if `use_count === 0` and `created_at` is older than 30 days, call `archive_user_skill`. If `use_count < 3` and `last_used_at` is older than 60 days, call `archive_user_skill` with reason `stale: low use`. System skills (`source = 'system'`) are never touched.

**Pass 2 — Personality Trait Decay**
Reads all active personality traits. Applies time-based strength decay:
- Trait not seen in a session in 30 days: reduce strength by 0.1
- Trait with strength < 0.15 after decay: call `archive_personality_trait`
- Traits with `evidence_count >= 5` that have been active 90+ days: call `update_personality_trait` with `strength = min(1.0, current + 0.05)` to reinforce stable patterns

**Pass 3 — Memory Consolidation Check**
Reads all `user_memory` entries. Flags for human review (writes a `write_user_memory` entry under `system.curator_flags`) any entries that appear contradictory — same namespace and key, different values written within a short window.

---

## PatternDetectionAgent — Behavioral Pattern Discovery

### Schedule

Fires via DO alarm on a 14-day interval. Unlike Curator, PatternDetectionAgent does not check for active sessions — it only reads, it does not write disruptive changes.

### What It Does

Reads `memory_event` rows from the last 14 days. Passes them to Claude with a structured analysis prompt. Claude returns detected patterns as structured JSON. PatternDetectionAgent writes confirmed patterns to `user_memory` under the `patterns.*` namespace via the forwarding protocol.

```typescript
// PatternDetectionAgent system prompt

const PATTERN_DETECTION_PROMPT = `
You are Brioela's pattern detection agent. You have been given the user's food event
history from the last 14 days. Your job: find real behavioral patterns that the user
probably doesn't consciously know about.

Good patterns to find:
- Specific foods correlated with changes in other behavior (scan more or less, cook more, log sickness)
- Time-of-day or day-of-week eating patterns
- Scan-but-never-buy patterns (systematic avoidance vs random browsing)
- Ingredient co-occurrence in scanned products (building evidence for a preference or dislike)

Bad patterns to report:
- Anything based on fewer than 3 occurrences
- Anything the user has already explicitly told Brioela (it would be in user_memory — check)
- Generic observations ("user scans mostly at lunch") — only report if the pattern is specific enough to be actionable

For each pattern you find:
{
  "namespace": "patterns.{domain}",
  "key": "snake_case_pattern_name",
  "value": "one clear sentence describing the pattern and its evidence",
  "confidence": 0.0–1.0,
  "evidence_count": number_of_data_points
}

Only return patterns with confidence >= 0.65 and evidence_count >= 3.
`
```

---

## HTTP Tool Forwarding — Full Flow

When CuratorAgent or PatternDetectionAgent calls a tool, the flow is:

```
CuratorAgent LLM decides to call archive_user_skill("stale-skill")
    ↓
CuratorAgent executes tool via HTTP:
    POST https://{brain-do-url}/internal/tool-call
    Authorization: Bearer {INTERNAL_SECRET}
    {
      "tool":    "archive_user_skill",
      "caller":  "curator",
      "args":    { "name": "stale-skill", "reason": "stale: use_count=1, last_used 67 days ago" },
      "run_id":  "curator_abc123"
    }
    ↓
Brain internal-tool.handler.ts:
    1. Validates Authorization header
    2. Checks 'curator' has permission to call 'archive_user_skill' (TOOL_PERMISSIONS)
    3. Validates args against archive_user_skill's Zod schema
    4. Executes archiveUserSkill() against its SQLite
    5. Returns { result: { name: "stale-skill", status: "archived" } }
    ↓
CuratorAgent receives result — continues to next skill
```

The sub-agent is completely unaware that execution happened in a different DO. From its perspective: it called a tool, it got a result.

---

## Sub-Agent DO Class

All sub-agents use the same base pattern — they extend `Agent` but override `fetch()` to run their specific job synchronously and return when done. They never set alarms. They never hold WebSocket connections.

```typescript
// backend/src/agents/curator/curator.agent.ts

import { Agent } from 'agents'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { Env } from '@/types/env'

export class CuratorAgent extends Agent<Env> {
  override async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname !== '/run') {
      return new Response('Not found', { status: 404 })
    }

    // Extract userId from DO name (set by Brain when spawning)
    const userId = await this.ctx.storage.get<string>('userId')
    if (!userId) return new Response('Missing userId', { status: 400 })

    const brainUrl = `https://brain-${userId}.internal`

    await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: CURATOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Run the three curator passes.' }],
      tools: buildForwardingTools(brainUrl, this.env.INTERNAL_SECRET, 'curator'),
      maxSteps: 50,
    })

    // DO will be evicted by Cloudflare after idle — no explicit shutdown needed
    return new Response('ok')
  }
}
```

`buildForwardingTools()` creates lightweight `tool()` wrappers that POST to `/internal/tool-call` instead of executing locally. The LLM sees the same tool schemas — it does not know or care that execution is remote.
