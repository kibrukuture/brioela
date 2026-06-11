# Spec: BrainMaintenanceAgent + BehaviorPatternAgent

## Why This Spec Exists

Two background agents run on schedule inside the Brioela system: **BrainMaintenanceAgent** (maintenance) and **BehaviorPatternAgent** (discovery). They are distinct sub-agents with different jobs, different tool subsets, different inputs, different outputs, and different schedules. This spec defines both — their architecture, their exact passes, their tool protocols, their failure handling, and the boundaries they must never cross.

Neither agent is user-facing. Neither talks to the user. Both produce outcomes that make the next user-facing session better.

---

## Architecture — Brain-Owned Child Agents, Persistent Brain

Every agent in Brioela is a Cloudflare Durable Object. What separates them is the ID they are keyed by:

```
CF Worker receives request
└── routes to BrioelaBrain DO
    key: idFromName(userId)          ← PERSISTENT — same DO instance forever per user
    has: SQLite (the user's brain)
    never dies
    │
    ├── on brain_maintenance_run alarm:
    │   spawns BrainMaintenanceAgent child Agent
    │   key: subAgent(BrainMaintenanceAgent, `brain-maintenance-${userId}-${runId}`)
    │   temporary run state only; permanent writes go through typed Brain RPC
    │   dies when work is done (CF evicts on idle)
    │
    └── on behavior_pattern_detection alarm:
        spawns BehaviorPatternAgent child Agent
        key: subAgent(BehaviorPatternAgent, `behavior-pattern-${userId}-${runId}`)
        temporary run state only; permanent writes go through typed Brain RPC
        dies when work is done
```

All agents — Brain, BrainMaintenanceAgent, BehaviorPatternAgent, MiraSession, ProductScanAgent — are the same kind of entity. They all use LLMs. They all use tools. The difference is ownership. The Brain's `userId` key makes it permanent. Brain-owned child agents do temporary work and call typed Brain RPC for user truth.

---

## Typed Brain RPC — Tools Defined and Executed Once

Sub-agents (BrainMaintenanceAgent, BehaviorPatternAgent, and all others) do not own user truth. Every permanent read/write goes through typed Brain RPC. The Brain validates input, enforces caller policy, executes the underlying tool or handler against its SQLite, and returns a typed result.

**Tools are defined ONCE. Executed ONCE. In the Brain. Always.**

Sub-agents call typed Brain methods or AI SDK tool wrappers that call typed Brain methods. The Brain runs the write.

### Parent/Child RPC

When a sub-agent needs a permanent Brain write:

```typescript
const brain = await this.parentAgent<BrioelaBrain>()

await brain.archiveUserSkill({
  name: 'stale-skill-name',
  reason: 'stale: use_count=1, last_used 67 days ago',
  archivedBy: 'BrainMaintenanceAgent',
  runId,
})
```

Brain on receiving this typed call:
1. Validates input with the RPC/tool Zod schema
2. Validates the caller is allowed to perform the write
3. Executes the tool or handler against SQLite
4. Returns a typed result:

```json
{
  "name": "stale-skill-name",
  "status": "archived",
  "archived_reason": "stale: use_count=1, last_used 67 days ago"
}
```

The sub-agent receives this as a normal typed method result. It never imports Brain schema and never opens Brain SQLite.

### Authorization: Tool Subsets Per Caller

Not every agent can call every tool. The Brain enforces caller-based authorization inside `_policies/` before every permanent write:

```typescript
const TOOL_PERMISSIONS: Record<string, string[]> = {
  brain_maintenance: [
    // read tools (brain-maintenance-specific, no side effects on usage counters)
    'get_skills_for_brain_maintenance',
    'get_personality_traits_for_brain_maintenance',
    'get_user_memory_for_brain_maintenance',
    // write tools from the 17 (forwarded)
    'update_user_skill',
    'archive_user_skill',
    'schedule_user_alarm',
    // brain-maintenance-only write tools (not in the 17)
    'update_personality_trait',
    'archive_personality_trait',
    'create_personality_trait',
  ],
  behavior_pattern_detection: [
    // read tools
    'get_memory_events_since',
    'get_personality_traits_for_brain_maintenance',   // to know what is already captured
    'get_user_memory_for_brain_maintenance',           // to find existing facts for evidence
    // write tools
    'write_user_memory',                     // writes to pattern.* namespace only
    'schedule_user_alarm',
  ],
  cooking: [
    'write_user_memory',
    'create_user_skill',
    'log_memory_event',
    'view_user_recipe',
    'propose_user_constraint',
    'schedule_user_alarm',
    'search_web',
  ],
  chat: [
    'write_user_memory',
    'read_user_memory',
    'log_memory_event',
    'propose_user_constraint',
    'confirm_user_constraint',
    'create_user_skill',
    'update_user_skill',
    'archive_user_skill',
    'schedule_user_alarm',
    'cancel_user_alarm',
    'search_session_history',
    'search_web',
  ],
  product_scan: [
    'log_memory_event',
    'write_user_memory',
    'propose_user_constraint',
    'search_web',
  ],
}

function isToolAllowed(caller: string, tool: string): boolean {
  return TOOL_PERMISSIONS[caller]?.includes(tool) ?? false
}
```

If a sub-agent calls a tool it is not authorized for, the Brain returns `{ error: 'tool_not_authorized', tool, caller }`. The sub-agent cannot override this. No exceptions.

---

## Brain maintenance-Specific Tools (Not in the 17)

The 17 tools specced in `brioela-tools/` are for the live agent during user sessions. The Brain maintenance needs additional read tools that do NOT trigger side effects (no `use_count` increments, no `last_used_at` updates — those are live-agent signals, not maintenance reads):

### get_skills_for_brain_maintenance

Returns all `source = 'user'` skills with full metadata. No side effects.

```typescript
// returns:
{
  skills: Array<{
    name:          string
    description:   string
    content:       string
    tags:          string[]
    status:        'active' | 'stale' | 'archived'
    version:       number
    use_count:     number
    last_used_at:  number | null
    created_at:    number
    updated_at:    number
  }>
}
```

### get_personality_traits_for_brain_maintenance

Returns all `user_personality` rows regardless of `isActive` status. Brain maintenance needs to see deactivated traits to decide whether to reactivate or leave them.

```typescript
{
  traits: Array<{
    id:             string
    trait:          string
    summary:        string
    evidence:       string[]   // user_memory IDs
    strength:       number
    isActive:       boolean
    revised_count:  number
    inferred_at:    number
    last_seen_at:   number
    updated_at:     number
  }>
}
```

### get_user_memory_for_brain_maintenance

Reads `user_memory` entries by IDs or by namespace. No `read_count` increment (Brain maintenance reads are not usage signals).

```typescript
// input:
{ ids?: string[], namespace?: string }
// output:
{ entries: Array<{ id, namespace, key, value, updated_at }> }
```

### get_memory_events_since (BehaviorPatternAgent only)

Returns `memory_event` rows created after a given timestamp, up to a limit. Ordered by `created_at ASC`.

```typescript
// input:
{ since_timestamp: number, limit?: number }   // limit defaults to 500, max 2000
// output:
{ events: Array<{ id, kind, payload, captured_at, source, entity_kind, entity_id }>, has_more: boolean }
```

### update_personality_trait

Updates strength, summary, evidence, last_seen_at, revised_count on an existing trait.

```typescript
// input:
{
  id:           string   // UUID of the trait row
  strength:     number   // new strength value 0.0–1.0
  summary?:     string   // new summary if Brain maintenance is refining it
  evidence?:    string[] // updated evidence array (can only grow, never shrink)
  last_seen_at: number   // timestamp of most recent supporting evidence
}
```

### archive_personality_trait

Sets `isActive = false`. Never deletes. Requires reason.

```typescript
// input:
{ id: string, reason: string }
// output:
{ id, trait, isActive: false }
```

### create_personality_trait

Inserts a new row into `user_personality`. Called by both BrainMaintenanceAgent (Pass 3) and BehaviorPatternAgent (indirectly, after writing to user_memory first and letting the next Brain maintenance run pick it up — see below).

```typescript
// input:
{
  trait:    string    // Zod: /^[a-z][a-z0-9-]*$/, max 64
  summary:  string    // Brain maintenance-written paragraph — user-specific description
  evidence: string[]  // user_memory IDs that support this inference — min 1
  strength: number    // initial strength 0.3–0.7 — never starts at 1.0
}
// system fills: id (UUID), user_id, isActive=true, revised_count=0, inferred_at=now, last_seen_at=now, updated_at=now
```

---

## Scheduling — Two Separate Alarm Types

`brain_maintenance_run` and `behavior_pattern_detection` are two distinct alarm types that trigger two distinct sub-agents. They run at different frequencies because they do different things:

- `behavior_pattern_detection` — runs every **3 days**. Lightweight. Scans new raw events. Fast.
- `brain_maintenance_run` — runs every **7 days**. Heavy. Full maintenance pass. Multiple LLM sub-calls.

### First Run Scheduling (Gap Item 8)

The DO initialization sequence (`12-schema-version.md`, step 3) seeds both alarms after setting `do.initialized = 'true'` in `agent_state`:

```typescript
// After do.initialized check in startup sequence:

const existingBrainMaintenance = db.select().from(scheduledAlarms)
  .where(and(
    eq(scheduledAlarms.alarmType, 'brain_maintenance_run'),
    eq(scheduledAlarms.status, 'pending')
  )).get()

if (!existingBrainMaintenance) {
  db.insert(scheduledAlarms).values({
    id:          crypto.randomUUID(),
    userId:      ctx.userId,
    alarmType:   'brain_maintenance_run',
    status:      'pending',
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,  // 7 days from init
    payloadJson: '{}',
    triggeringSessionId: null,
    attempts:    0,
    createdAt:   Date.now(),
    updatedAt:   Date.now(),
  })
}

const existingPattern = db.select().from(scheduledAlarms)
  .where(and(
    eq(scheduledAlarms.alarmType, 'behavior_pattern_detection'),
    eq(scheduledAlarms.status, 'pending')
  )).get()

if (!existingPattern) {
  db.insert(scheduledAlarms).values({
    id:          crypto.randomUUID(),
    userId:      ctx.userId,
    alarmType:   'behavior_pattern_detection',
    status:      'pending',
    scheduledAt: Date.now() + 3 * 24 * 60 * 60 * 1000,  // 3 days from init
    payloadJson: '{}',
    triggeringSessionId: null,
    attempts:    0,
    createdAt:   Date.now(),
    updatedAt:   Date.now(),
  })
}

// Update DO alarm slot to the earliest of the two
await this.ctx.storage.setAlarm(Date.now() + 3 * 24 * 60 * 60 * 1000)
```

Both are system-scheduled — `triggeringSessionId = null`. No agent session created them.

### Self-Rescheduling After Completion

At the end of each run, the sub-agent calls `schedule_user_alarm` (forwarded to Brain) to queue the next run before it dies:

```typescript
// BrainMaintenanceAgent at end of run:
await callTool('schedule_user_alarm', {
  alarm_type:    'brain_maintenance_run',
  scheduled_at: Date.now() + 7 * 24 * 60 * 60 * 1000,
  payload:       {},
})

// BehaviorPatternAgent at end of run:
await callTool('schedule_user_alarm', {
  alarm_type:    'behavior_pattern_detection',
  scheduled_at: Date.now() + 3 * 24 * 60 * 60 * 1000,
  payload:       {},
})
```

---

## Race Condition Handling — Active Session Check

Both BrainMaintenanceAgent and BehaviorPatternAgent start with a mandatory active session check. If the user is in an active session, neither agent does any work.

```typescript
// First thing every sub-agent does after spin-up:
const activeSessionCheck = await callTool('check_active_session', {})

if (activeSessionCheck.has_active_session) {
  // Reschedule self for 1 hour later — do not proceed
  await callTool('schedule_user_alarm', {
    alarm_type:    this.alarmType,          // 'brain_maintenance_run' or 'behavior_pattern_detection'
    scheduled_at: Date.now() + 60 * 60 * 1000,
    payload:       {},
  })
  return { deferred: true, reason: 'active_session' }
}
```

`check_active_session` is an internal Brain query: `SELECT id FROM sessions WHERE status = 'active' LIMIT 1`. If any row returns, the check fails and both agents defer.

Why this matters: the Brain is the single writer. If a user session and BrainMaintenanceAgent both issue tool calls simultaneously, the Brain serializes them. But logical conflicts still occur — if the agent just created a new skill mid-cooking-session, the Brain maintenance should not immediately evaluate it for archival. The 1-hour defer means the Brain maintenance always runs against settled state.

---

## BrainMaintenanceAgent — Three Sequential Passes

The Brain spins up BrainMaintenanceAgent, gives it its system prompt (who it is, what its job is this run), and the agent proceeds through three passes in order using tool calls.

### Pass 1 — Skill Maintenance

**Purpose**: keep the skill table clean — stale, overlapping, or incoherent skills removed.

**Step 1: Fetch all user skills**

```typescript
const { skills } = await callTool('get_skills_for_brain_maintenance', {})
const now = Date.now()
```

**Step 2: Apply stale thresholds (rule-based, no LLM)**

Stale thresholds (Gap Item 11 — defined here as starting values, tunable):

| Condition | Action |
|---|---|
| `use_count < 3` AND `last_used_at < now - 30 days` AND `status = 'active'` | Set status to `'stale'` via `update_user_skill` |
| `status = 'stale'` AND `last_used_at < now - 60 days` | Archive via `archive_user_skill` |
| `use_count = 0` AND `last_used_at IS NULL` AND `created_at < now - 14 days` | Archive — never used in 2 weeks |
| `version > 5` AND `use_count < 2` | Flag in BrainMaintenanceAgent context for review in next LLM sub-call |

```typescript
for (const skill of skills) {
  const daysSinceUsed = skill.last_used_at
    ? (now - skill.last_used_at) / 86400000
    : Infinity

  if (skill.status === 'active' && skill.use_count < 3 && daysSinceUsed > 30) {
    await callTool('update_user_skill', {
      name:       skill.name,
      content:    skill.content,       // unchanged
      reason:     `Brain maintenance: stale — use_count=${skill.use_count}, last_used=${Math.round(daysSinceUsed)}d ago`,
      updated_by: 'brain_maintenance',
    })
    // Note: update_user_skill sets status based on brain maintenance judgment — needs a status field added
    // OR: use a separate internal set_skill_status tool
  }

  if (skill.status === 'stale' && daysSinceUsed > 60) {
    await callTool('archive_user_skill', {
      name:        skill.name,
      reason:      `Brain maintenance: archived — stale for ${Math.round(daysSinceUsed)}d, use_count=${skill.use_count}`,
      archived_by: 'brain_maintenance',
    })
  }
}
```

**Step 3: Overlap detection (LLM sub-call)**

Group active skills by shared tags. Any group with 2+ skills gets an LLM evaluation pass:

```
System prompt for this sub-call:
"You are reviewing a user's skill collection for overlap. Your job:
 identify pairs of skills where one covers what the other already covers.
 For each overlap: decide which is more general/useful (keep it), which is redundant (archive it).
 You cannot create new skills. You can only archive the redundant one."

User message:
"Here are the skills to review: [name, description, tags, use_count for each]
 Return a list of archive decisions: [{ name_to_archive, keep_name, reason }]"
```

BrainMaintenanceAgent applies decisions:
```typescript
for (const decision of overlapDecisions) {
  await callTool('archive_user_skill', {
    name:        decision.name_to_archive,
    reason:      `Brain maintenance: overlap — superseded by ${decision.keep_name}. ${decision.reason}`,
    archived_by: 'brain_maintenance',
  })
}
```

---

### Pass 2 — Personality Trait Decay (Rule-Based)

**Purpose**: reduce strength of traits that no longer have supporting evidence. Deactivate traits below the minimum threshold.

**Step 1: Fetch all active traits**

```typescript
const { traits } = await callTool('get_personality_traits_for_brain_maintenance', {})
const now = Date.now()
```

**Step 2: Apply decay rules from `03-user-personality.md`**

```typescript
for (const trait of traits.filter(t => t.isActive)) {
  const daysSinceSeen = (now - trait.last_seen_at) / 86400000

  // Passive decay: -0.03 per 30 days with no new supporting evidence
  const decayPeriods = Math.floor(daysSinceSeen / 30)
  const decayAmount  = decayPeriods * 0.03

  // Also check evidence: re-read user_memory entries in the evidence array
  const { entries: evidenceEntries } = await callTool('get_user_memory_for_brain_maintenance', {
    ids: trait.evidence
  })

  const activeEvidence      = evidenceEntries.filter(e => e.isActive)
  const contradictingCount  = 0  // BrainMaintenanceAgent LLM pass handles contradiction detection

  let newStrength = trait.strength - decayAmount
  newStrength = Math.max(0, Math.min(1, newStrength))

  if (newStrength < 0.15) {
    await callTool('archive_personality_trait', {
      id:     trait.id,
      reason: `Brain maintenance: strength decayed to ${newStrength.toFixed(2)} — below 0.15 threshold`,
    })
  } else if (newStrength !== trait.strength) {
    await callTool('update_personality_trait', {
      id:          trait.id,
      strength:    newStrength,
      last_seen_at: trait.last_seen_at,  // unchanged — no new evidence found
    })
  }
}
```

Decay is pure math — no LLM needed. The rule comes from `03-user-personality.md` directly: -0.03 per 30 days without reinforcement, deactivate below 0.15.

---

### Pass 3 — Personality Trait Inference (LLM Sub-Call)

**Purpose**: discover new personality traits from accumulated `user_memory` facts that the Brain maintenance has not yet synthesized.

**Step 1: Load current knowledge**

```typescript
// All active user_memory entries
const { entries: memoryEntries } = await callTool('get_user_memory_for_brain_maintenance', {
  namespace: undefined   // load everything — all namespaces
})

// Current active traits — so BrainMaintenanceAgent knows what is already captured
const { traits: existingTraits } = await callTool('get_personality_traits_for_brain_maintenance', {})
const activeTraitNames = existingTraits.filter(t => t.isActive).map(t => t.trait)
```

**Step 2: LLM inference sub-call**

```
System prompt:
"You are the Brioela Brain maintenance. Your job is to synthesize personality traits from
 accumulated user facts. A trait is a behavioral pattern that emerged across many
 facts — not a single observation, not a declared preference.

 Rules:
 - Only propose traits supported by 3+ distinct user_memory entries
 - Never duplicate an existing trait — check the existing list first
 - Initial strength: 0.4 if pattern is tentative, 0.6 if pattern is clear, 0.7 if overwhelming
 - Never set initial strength above 0.7 — traits must earn high strength through reinforcement
 - Trait name format: lowercase, hyphens only, max 64 chars (e.g. 'stress-eater', 'family-cook')
 - Summary must be user-specific — describe this exact user's pattern, not a generic definition
 - Evidence must list the exact user_memory IDs that support this inference"

User message:
"Existing traits (do not duplicate): [list of trait names]

 User memory entries: [namespace:key → value, importance score for all entries]
 Note: importance is 1–10 (10 = safety-critical, 5 = useful fact, 1 = trivial observation).
 Weight your evidence toward high-importance entries — a trait supported by three
 importance-8 entries is stronger than one supported by six importance-2 entries.

 What new behavioral traits do you observe that are not yet captured?
 Return JSON array of:
 {
   trait: string,
   summary: string,
   evidence: string[],   // user_memory IDs (namespace:key format)
   strength: number
 }"
```

**Step 3: Apply proposals**

```typescript
for (const proposal of traitProposals) {
  // Guard: don't create if name already exists (including deactivated traits)
  const existing = existingTraits.find(t => t.trait === proposal.trait)
  if (existing) {
    if (!existing.isActive) {
      // Reactivate with updated evidence rather than creating duplicate
      await callTool('update_personality_trait', {
        id:          existing.id,
        strength:    proposal.strength,
        summary:     proposal.summary,
        evidence:    [...new Set([...existing.evidence, ...proposal.evidence])],
        last_seen_at: Date.now(),
      })
    }
    continue  // skip — already exists and active
  }

  await callTool('create_personality_trait', {
    trait:    proposal.trait,
    summary:  proposal.summary,
    evidence: proposal.evidence,
    strength: proposal.strength,
  })
}
```

---

## BehaviorPatternAgent — Full Flow

BehaviorPatternAgent is fundamentally different from BrainMaintenanceAgent. It works on raw `memory_event` data — not derived tables. Its job: find patterns in raw events that have not yet been abstracted into facts or traits.

Its output is NOT written directly to `user_personality`. Its output goes to `user_memory` in the `pattern.*` namespace. Those entries then become available to the BrainMaintenanceAgent on its next weekly run as evidence for trait inference. This preserves the chain:

```
memory_event → BehaviorPatternAgent → user_memory (pattern.* namespace)
                                              ↓
                                        BrainMaintenanceAgent → user_personality
```

BehaviorPatternAgent never writes to `user_personality` directly. It cannot — it is not in its tool subset.

### Step 1: Find the scan window

```typescript
// Read last run timestamp from agent_state
const lastRunTs = await brain.getAgentState('behavior_pattern_detection.last_run')
const sinceTimestamp = lastRunTs ? parseInt(lastRunTs) : Date.now() - 7 * 24 * 60 * 60 * 1000
```

If `behavior_pattern_detection.last_run` is not set (first ever run), scan the last 7 days.

### Step 2: Fetch new events

```typescript
const { events, has_more } = await callTool('get_memory_events_since', {
  since_timestamp: sinceTimestamp,
  limit: 500
})
// If has_more = true: process what we have, note the gap in outcome_summary
// Never try to process unbounded events in one run
```

### Step 3: Fetch context (existing traits + existing user_memory)

```typescript
const { traits }  = await callTool('get_personality_traits_for_brain_maintenance', {})
const { entries } = await callTool('get_user_memory_for_brain_maintenance', { namespace: 'pattern' })
// Know what is already captured so we don't re-discover known patterns
```

### Step 4: LLM behavior pattern detection sub-call

```
System prompt:
"You are Brioela's behavior pattern detection system. You analyze raw behavioral events
 to find recurring patterns not yet captured as user facts.

 Rules:
 - A pattern needs 3+ events of the same behavioral type to be significant
 - Patterns already captured as user_memory facts or personality traits: skip them
 - Output is a new user_memory fact, not a personality trait
 - Namespace for all output: 'pattern' (e.g. pattern.late-night-scan-comfort-food)
 - Key format: kebab-case description of the pattern
 - Value: JSON object with pattern description, supporting event IDs, confidence"

User message:
"Events since last scan: [event list with kind, payload, captured_at]

 Already captured patterns (pattern.* namespace): [existing entries]
 Existing personality traits: [trait names — so you don't re-discover what's already a trait]

 What new behavioral patterns do you observe?
 Return JSON array of:
 {
   key: string,          // kebab-case, e.g. 'late-night-scan-comfort-food'
   description: string,  // human-readable pattern description
   event_ids: string[],  // supporting memory_event IDs
   confidence: number    // 0.0 to 1.0
 }"
```

### Step 5: Write patterns to user_memory (pattern namespace)

Only patterns above confidence threshold (0.6) are written:

```typescript
for (const pattern of detectedPatterns.filter(p => p.confidence >= 0.6)) {
  await callTool('write_user_memory', {
    namespace: 'pattern',
    key:       pattern.key,
    value: {
      description: pattern.description,
      event_ids:   pattern.event_ids,
      confidence:  pattern.confidence,
      detected_at: Date.now(),
    },
  })
}
```

These become valid evidence entries for BrainMaintenanceAgent's trait inference on the next `brain_maintenance_run` — the BrainMaintenanceAgent reads all user_memory including `pattern.*` entries.

### Step 6: Update last run timestamp + reschedule

```typescript
await brain.setAgentState('behavior_pattern_detection.last_run', String(Date.now()))

await callTool('schedule_user_alarm', {
  alarm_type:    'behavior_pattern_detection',
  scheduled_at: Date.now() + 3 * 24 * 60 * 60 * 1000,
  payload:       {},
})
```

---

## Session Tracking

Both agents run as `background` session rows. The Brain creates the session row before spinning up the sub-agent and updates it when the sub-agent reports back:

```typescript
// Before spin-up:
db.insert(sessions).values({
  id:           runId,
  userId:       ctx.userId,
  sessionType:  'background',
  alarmType:    alarmType,   // 'brain_maintenance_run' or 'behavior_pattern_detection'
  status:       'active',
  model:        'claude-sonnet-4-6',
  startedAt:    Date.now(),
  // all token counts start at 0
})

// After sub-agent reports back:
db.update(sessions).set({
  status:         'completed',
  outcomeSummary: subAgentOutcome.summary,
  inputTokens:    subAgentOutcome.input_tokens,
  outputTokens:   subAgentOutcome.output_tokens,
  endedAt:        Date.now(),
  endReason:      'completed',
})
```

---

## Failure Handling

### BrainMaintenanceAgent fails mid-pass

The scheduled_alarms row stays at `status = 'processing'`. On the next DO wake-up (when the next alarm fires), the handler sees the processing row, increments `attempts`, and can retry the full run. BrainMaintenanceAgent is stateless — a full retry is safe because:
- Pass 1 (skill maintenance): re-reading stale skills is idempotent. A skill already archived returns an error from `archive_user_skill` which the Brain maintenance handles gracefully.
- Pass 2 (decay): re-applying decay math is idempotent. A trait already at 0.10 stays at 0.10 — additional decay does not go below 0.
- Pass 3 (inference): `create_personality_trait` with a duplicate name returns an error — Brain maintenance skips it.

Max retry attempts: 3. After 3 failures, `status = 'failed'`, `fail_reason` written. Next brain_maintenance_run scheduled from now normally — one failed run does not block the next cycle.

### BehaviorPatternAgent fails

Same retry logic. The `behavior_pattern_detection.last_run` timestamp is NOT updated on failure — next run re-scans from the same `since_timestamp`. Events are not lost. The scan window grows until the next successful run processes them.

---

## Hard Boundaries — What Each Agent Cannot Touch

### BrainMaintenanceAgent CANNOT:
- Write to `constraints` — safety-critical, only live agent + user confirmation
- Write to `recipes` — user-confirmed lifecycle only
- Write to `user_memory` — only live agent writes facts from real sessions
- Write to `memory_event` — append-only, Brain maintenance reads only
- Touch `source = 'system'` skills — system skills are code-only
- Call `create_user_skill` — Brain maintenance does not create new skills, only maintains existing ones

### BehaviorPatternAgent CANNOT:
- Write to `user_personality` directly — only BrainMaintenanceAgent synthesizes traits
- Write to `constraints` — never
- Write to `recipes` — never
- Touch `skills` at all — not in its job
- Write to `user_memory` outside the `pattern.*` namespace — enforced by Zod in `write_user_memory` (namespace prefix check)

### Both CANNOT:
- Create or modify `scheduled_alarms` rows other than their own rescheduling
- Modify `sessions` rows other than their own session row (managed by Brain)
- Access another user's DO — the Brain only passes the current user's context

---

## Auto-Confirmation Time Windows (Gap Item 10)

The constraint auto-confirmation thresholds in `06-constraints.md` now have time windows:

| Type | Threshold | Time Window |
|---|---|---|
| `dislike` | 5+ avoidance events, zero contradictions | Within last 90 days |
| `intolerance` | 3+ negative outcome events, no contradictions | Within last 60 days |
| `boycott` | 7+ consistent avoidance events, no purchases | Within last 120 days |

Events older than the time window do not count toward the threshold. Old behavior that has not been reinforced recently should not auto-confirm a constraint.

These thresholds are enforced in agent logic during live sessions — not by the Brain maintenance, not by BehaviorPatternAgent.
