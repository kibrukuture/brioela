# Brain — Sub-Agents

## What This File Covers

The Brain-owned sub-agent pattern, BrainMaintenanceAgent, BehaviorPatternAgent, typed parent-child Agent RPC, retained child runs, and Brain-owned authorization boundaries.

---

## The Pattern — Brain-Owned Child Agents, Permanent Brain

All agents in Brioela are Cloudflare Durable Objects. What separates them is the ID they are keyed by:

```
BrioelaBrain
  key: idFromName(userId)                                ← PERMANENT — same instance forever
  has: SQLite (the user's brain)
  never dies
  │
  ├── on brain_maintenance_run alarm:
│   spawns BrainMaintenanceAgent
  │   key: subAgent(BrainMaintenanceAgent, `brain-maintenance-${userId}-${runId}`)
  │   temporary work only — permanent writes go through typed Brain RPC
  │   dies when work is done
  │
  └── on behavior_pattern_detection alarm:
      spawns BehaviorPatternAgent
      key: subAgent(BehaviorPatternAgent, `behavior-pattern-${userId}-${runId}`)
      temporary work only — permanent writes go through typed Brain RPC
      dies when work is done
```

Sub-agents may have isolated Agent storage for their own temporary run state, but they do not own user truth. Every read of user truth and every permanent write goes through typed Brain RPC methods such as `readBrainContext()`, `writeBrainMemory()`, `appendMemoryEvent()`, and `checkActiveSession()`.

**Tools are defined once and executed once — always in the Brain.**

Custom `/internal/tool-call` HTTP forwarding is not the default. It is a fallback for external boundaries only. Brain-owned child agents use `subAgent()` and `parentAgent()`.

---

## BrainMaintenanceAgent — Background Maintenance

### Schedule

Fires via an Agents SDK schedule on a 7-day interval. Before running, the Brain checks whether the user has been idle (no sessions in the last 2 hours). If the user is in an active session, the brain maintenance run is rescheduled 2 hours later — it never interrupts a live session.

```typescript
// In alarm.handler.ts — BRAIN_MAINTENANCE_RUN alarm case

case 'brain_maintenance_run': {
  // Check idle: no active session in last 2 hours
  const recentSession = db.select().from(sessions)
    .where(and(
      eq(sessions.status, 'active'),
      gt(sessions.startedAt, Date.now() - 2 * 60 * 60 * 1000),
    )).get()

  if (recentSession) {
    // User active — reschedule 2 hours later
    await scheduleUserAlarm({
      alarmType: 'brain_maintenance_run',
      payload: { userId },
      scheduledAt: Date.now() + 2 * 60 * 60 * 1000,
      label: 'Brain maintenance run deferred while user is active',
    })
    return
  }

  const runId = createId()
  const brainMaintenance = await this.subAgent(
    BrainMaintenanceAgent,
    `brain-maintenance-${userId}-${runId}`,
  )

  await brainMaintenance.runMaintenancePass({ userId, runId })

  // Reschedule next brain maintenance run — 7 days
  await scheduleUserAlarm({
    alarmType: 'brain_maintenance_run',
    payload: { userId },
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    label: 'Weekly brain maintenance run',
  })
  break
}
```

### Three Passes

BrainMaintenanceAgent runs three passes in order. It calls typed Brain RPC for reads and proposed writes. The Brain remains the only owner of SQLite writes.

**Pass 1 — Skill Maintenance**
Reads all active skills. For each skill: if `use_count === 0` and `created_at` is older than 30 days, call `archive_user_skill`. If `use_count < 3` and `last_used_at` is older than 60 days, call `archive_user_skill` with reason `stale: low use`. System skills (`source = 'system'`) are never touched.

**Pass 2 — Personality Trait Decay**
Reads all active personality traits. Applies time-based strength decay:
- Trait not seen in a session in 30 days: reduce strength by 0.1
- Trait with strength < 0.15 after decay: call `archive_personality_trait`
- Traits with `evidence_count >= 5` that have been active 90+ days: call `update_personality_trait` with `strength = min(1.0, current + 0.05)` to reinforce stable patterns

**Pass 3 — Memory Consolidation Check**
Reads all `user_memory` entries. Flags for human review (writes a `write_user_memory` entry under `system.brain_maintenance_flags`) any entries that appear contradictory — same namespace and key, different values written within a short window.

---

## BehaviorPatternAgent — Behavioral Pattern Discovery

### Schedule

Fires via DO alarm on a 14-day interval. Unlike Brain maintenance, BehaviorPatternAgent does not check for active sessions — it only reads, it does not write disruptive changes.

### What It Does

Reads `memory_event` rows from the last 14 days through Brain RPC. Passes them to Claude with a structured analysis prompt. Claude returns detected patterns as structured JSON. BehaviorPatternAgent asks Brain to write confirmed patterns to `user_memory` under the `patterns.*` namespace.

```typescript
// BehaviorPatternAgent system prompt

const BEHAVIOR_PATTERN_PROMPT = `
You are Brioela's behavior pattern detection agent. You have been given the user's food event
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
  "key": "snake_case_behavior_pattern_name",
  "value": "one clear sentence describing the pattern and its evidence",
  "confidence": 0.0–1.0,
  "evidence_count": number_of_data_points
}

Only return patterns with confidence >= 0.65 and evidence_count >= 3.
`
```

---

## Typed Brain RPC — Full Flow

When BrainMaintenanceAgent or BehaviorPatternAgent calls a tool, the flow is:

```
BrainMaintenanceAgent LLM decides to call archive_user_skill("stale-skill")
    ↓
BrainMaintenanceAgent gets typed parent stub:
    const brain = await this.parentAgent<BrioelaBrain>()
    await brain.archiveUserSkill({
      name: 'stale-skill',
      reason: 'stale: use_count=1, last_used 67 days ago',
      archivedBy: 'BrainMaintenanceAgent',
      runId,
    })
    ↓
Brain RPC method:
    1. Validates input with Zod
    2. Checks BrainMaintenanceAgent has permission to archive user skills
    3. Executes archiveUserSkill() against Brain SQLite
    4. Returns { name: 'stale-skill', status: 'archived' }
    ↓
BrainMaintenanceAgent receives result — continues to next skill
```

The sub-agent does not import Brain schema or touch Brain SQLite. From its perspective: it called a typed parent method, it got a typed result.

---

## Sub-Agent DO Class

All Brain-owned child agents use the same base pattern: they extend `Agent`, expose one or more typed callable methods, and keep permanent truth in Brain. They may use child-local state for run progress, but that state is not user truth.

```typescript
// backend/src/agents/brain/_subagents/brain-maintenance/brain.maintenance.agent.ts

import { Agent } from 'agents'
import { callable } from 'agents'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { BrioelaBrain } from '../../brioela.brain.agent'
import type { Env } from '@/types/env'

export class BrainMaintenanceAgent extends Agent<Env> {
  @callable()
  async runMaintenancePass(input: RunMaintenancePass): Promise<MaintenancePassSummary> {
    const brain = await this.parentAgent<BrioelaBrain>()
    const context = await brain.readBrainContext({
      userId: input.userId,
      purpose: 'brain_maintenance',
    })

    await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: BRAIN_MAINTENANCE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildMaintenancePrompt(context) }],
      tools: buildBrainMaintenanceTools(brain, input.runId),
      maxSteps: 50,
    })

    return { runId: input.runId, status: 'completed' }
  }
}
```

`buildBrainMaintenanceTools()` creates lightweight AI SDK `tool()` wrappers that call typed Brain RPC methods. The LLM sees normal tools. The code keeps a typed parent-child boundary.

---

## Retained Child Runs

Use `runAgentTool()` when Brain wants the model to delegate work to a child agent and keep a retained run timeline:

```typescript
await this.runAgentTool(BehaviorPatternAgent, {
  input: { userId: this.userId, windowDays: 14 },
  runId: `behavior-pattern-${this.userId}-${weekId}`,
})
```

Use retained child runs for work that benefits from replay, cancellation, progress inspection, or later drill-in. Use direct `subAgent()` RPC for ordinary scheduled work with a clear method call.

---

## Boundary Rules

- Brain-owned child agents live under `backend/src/agents/brain/_subagents/`.
- Child agents never import Brain `_schema/` directly.
- Child agents never construct Brain SQLite connections.
- Child agents call Brain through typed parent RPC.
- Brain validates every permanent write through `_policies/`.
- HTTP internal forwarding is a fallback only when a future boundary cannot use typed Agent RPC.
