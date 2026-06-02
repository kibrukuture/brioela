# 09. Per-User Agent Orchestrator

## Goal

Give each Brioela user a fully isolated, self-contained, event-driven agent that owns their private food memory, enforces their personal constraints, and coordinates all personalized behavior across the entire product.

## The Hermes Inspiration (Not a Direct Dependency)

The per-user agent is inspired by the Hermes agent architecture — specifically its closed learning loop, per-user memory isolation, and self-improvement over time. However, Hermes Agent itself cannot run on Cloudflare. It requires 4GB RAM minimum and runs as a persistent process on Linux/VPS. Cloudflare Durable Objects run in a V8 isolate — no filesystem, no persistent process, no Docker. They are fundamentally different execution models.

What Brioela builds: a custom lightweight agent using the Cloudflare Agent SDK on top of Durable Objects. It takes Hermes as inspiration for the memory architecture and event-driven self-improvement loop but is built natively on Cloudflare so it runs at the edge, isolated per user, at global scale.

## Architecture: One Orchestrator DO Per User

Each user has exactly one `BrioelOrchestrator` — a Cloudflare Durable Object using the Agent SDK. This object:
- Is always addressable by userId.
- Has its own private SQLite database via `drizzle(this.ctx.storage, { schema })`.
- Hibernates when idle — near-zero cost.
- Wakes in milliseconds on any incoming event.
- Lives forever (until user deletes their account).

This is NOT a pooled or shared agent. One user's orchestrator never touches another user's data. The isolation comes from the DO's unique name — `idFromName(userId)` always returns the same instance, always private to that user.

## Two DO Roles

### BrioelOrchestrator (Permanent Brain)
Always exists per user. Holds all private SQLite memory. Handles real-time inline events (scan personalization, allergen checks, recipe reranking). Fires async jobs to Upstash for multi-step work. Sets alarms on itself for ambient intelligence.

### CookingAgent DO (Live Session Brain)
Spun up per cooking session. Named by `cook-{userId}-{recipeId}` so it's always the same instance for a given session. Holds live session state: current step, transcript accumulation, participant list, real-time context window. After session ends, fires summarization to Upstash Workflow and writes durable facts back to the Orchestrator DO's SQLite.

## When to Use a Sub-Agent DO vs a Plain Function

This is a critical architectural decision:

**Use a sub-agent DO when:**
- The task is long-running (a cooking session lasting 45 minutes).
- The task needs its own state during execution (step index, live transcript).
- The task needs to survive a connection drop and resume.
- The task holds WebSocket connections.

**Use a plain function when:**
- The task is fast and stateless (scan analysis, allergen lookup, product scoring).
- The task completes in one request lifecycle.
- No state needs to live between calls.

A product scan does NOT need a sub-agent DO. It calls `analyzeProduct(productId, env)` — a plain async function — and the Orchestrator DO saves the result to its SQLite. A cooking session DOES need a sub-agent DO because it's long-lived, stateful, and must survive disconnection.

## DO Hidden Capabilities Used by Brioela

### Drizzle ORM over SQLite
Raw `this.ctx.storage` is a low-level KV+SQLite interface. Brioela wraps it with Drizzle:
```
db = drizzle(this.ctx.storage, { schema })
```
This gives full type-safe SQL with schema, migrations, and queries. Each user's DO gets its own completely separate SQLite — not rows in a shared table, but physically separate SQLite files per user. Drizzle is wired to DO storage the same way it connects to Cloudflare D1.

wrangler.toml must declare the SQLite class:
```
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelOrchestrator"]
```
Without this line, the DO only has KV storage, not SQLite.

### DO Alarms — the Ambient Intelligence Engine

This is how the ambient features work without cron jobs. The Orchestrator DO can schedule its own wake-up call at any future time:

```
await this.ctx.storage.setAlarm(timestamp)
// then:
async alarm() {
  // runs automatically at that time
  // no cron, no external scheduler
}
```

Brioela uses alarms for:
- Weekly food summary: alarm fires Sunday morning, generates summary, notifies user.
- "You scanned X a week ago, did you buy it?" — set 7-day alarm on scan.
- Travel pre-load: alarm fires 48 hours before departure date to pre-load destination food intel.
- Pattern detection: alarm fires after accumulating enough behavioral data to analyze.
- Sickness follow-up: alarm fires 24 hours after user logs a sickness event.

Alarms are per-DO, cost nothing while waiting, and fire exactly once. This eliminates the need for any external cron system for user-specific timed events.

### WebSocket Hibernation
The DO can hold WebSocket connections open and hibernate between messages at zero cost. The moment a message arrives, it wakes in milliseconds. This is how the cooking session's voice connection stays alive across the natural gaps in a cooking conversation without burning money.

CPU time per DO is 30 seconds per request, configurable to 5 minutes. But a WebSocket cooking session is NOT one request — each message is a separate event with its own CPU budget. A 2-hour grandma cooking session generates thousands of tiny events (each ~50-100ms CPU). Total active CPU in a 2-hour session: roughly 30-60 seconds. The 5-minute limit is never hit.

### FTS5 Full-Text Search
Durable Objects support the SQLite FTS5 module. Brioela uses this for searching a user's scan history and recipe notes without any external search service. Query examples: "all scans where I found palm oil", "recipes mentioning grandma's technique".

### Storage Limits
10GB per DO instance. Unlimited rows (capped only by 10GB storage). A heavy user's complete lifetime food history, scans, recipes, patterns — realistically 20-50MB. 10GB provides ~200-500× headroom.

### Data Studio
SQLite-backed DOs can be viewed and edited in the Cloudflare dashboard via Data Studio. Invaluable for debugging a specific user's memory state in development and production.

## Upstash Integration: QStash vs Workflow — When to Use Each

**QStash (one-shot delivery)**: use when it's a single fire-and-forget message with no state needed between steps. Examples: send a push notification, trigger a product enrichment fetch, deliver a webhook.

**Upstash Workflow (multi-step with state)**: use when steps depend on each other, state must carry across steps, or you need `waitForEvent` to pause execution indefinitely at zero cost until an external trigger fires.

The `waitForEvent` pattern is critical for Brioela's ambient flows:
```
scan happens
→ step 1: deep product analysis (retries if fails)
→ step 2: cross-check user allergen list in DO
→ step 3: waitForEvent("community_note_added") ← pauses, zero cost
→ step 4: when note arrives, notify user with full context from steps 1+2
```

Upstash Workflow does NOT own or run your logic. Your code (Cloudflare Worker) runs each step. Upstash owns the orchestration state between steps — it knows which step you're on, carries context, handles retries, and resumes after `waitForEvent`. Each step is a separate HTTP call into your Worker endpoint.

## Upstash Box vs Cloudflare — Decision Record

Upstash Box was evaluated as an alternative for running per-user agents. Decision: Cloudflare DOs win.

Reason: Cloudflare Durable Objects run at the actual edge — automatically provisioned geographically close to where first requested. For a Brioela user scanning a product, their personal agent responds in under a second because it's physically close to them. Upstash Box is a managed compute environment that cannot do geographic edge co-location at that granularity. The latency difference matters for real-time scan personalization. Upstash remains the right choice for QStash, Redis, and Workflow — not for running the agent itself.

## Event Types the Orchestrator DO Receives

- Product scanned (product_id, geo_hash, verdict, match results).
- Recipe imported (recipe_id, source, confidence).
- Receipt ingested (merchant, line items, total).
- Cooking session started (session_id, recipe_id).
- Cooking session ended (session_id, transcript summary).
- Constraint confirmed by user (explicit allergy or dislike declaration).
- Constraint proposed (behavioral inference candidate).
- Sickness event logged.
- Travel intent detected (destination, date, confidence).
- Alarm fired (type determines what runs).
- **Visual intake classified** (classification_domain, summary, confidence, skill_to_activate) — see spec 34.

## Agent Tool Set (AI-Callable Tools)

The Orchestrator DO registers all capabilities as callable tools using the Vercel AI SDK `tool()` pattern. The AI agent decides which tools to call based on context — tools are never pre-selected or pre-injected by developer logic. The agent sees all tool schemas and calls what it needs, chains calls in any sequence, and discards what is irrelevant.

This means adding a new capability is always: write one `tool({})` definition. The AI starts using it automatically. No routing logic, no pre-filtering, no threshold tuning.

Tools registered on the Orchestrator DO:

**Skill management tools (the foundation — always registered):**
- `skill_view(name)` — load the full markdown content of a named skill from SQLite; increments use_count.
- `skill_create(name, description, content, tags)` — save a new reusable skill extracted from a conversation.
- `skill_update(name, content, reason)` — rewrite an existing skill with a better approach.
- `skill_archive(name, reason)` — remove a skill from the active index without deleting it; archived skills no longer appear in the prompt but their content and history are retained in SQLite. Use when a skill is superseded or no longer relevant.
- `skill_delete(name, reason)` — permanently delete a skill from SQLite. Irreversible. The agent calls this only when a skill is confirmed wrong, harmful, or a duplicate of another skill that already covers it better.

**Memory tools:**
- `memory_update(namespace, key, value, confidence, source)` — the single tool for all memory writes. Namespace is dot-separated (`health.medications`, `life.places`). Enforces regex + hard cap + merge logic. See the Memory Namespace System section for full implementation.
- `memory_read(namespace, key?)` — read one entry or all entries under a namespace.
- `propose_constraint(type, value, evidence)` — create an unconfirmed constraint candidate (allergy, dislike, dietary identity).
- `confirm_constraint(constraint_id)` — mark a proposed constraint as confirmed.
- `classify_visual_intake(image_bytes)` — classify a submitted photo, decide relevance, call `memory_update` with the result; see spec 34.
- `recall_session_context(query, session_id?)` — FTS5 search over archived cold-tier session turns. MemGPT paging pattern — cold storage is a searchable library, not a trash can.

**Action and scheduling tools:**
- `schedule_job(type, payload, delay)` — fire a one-shot background job via Upstash QStash.
- `start_workflow(type, payload)` — start a durable multi-step flow via Upstash Workflow.
- `get_session_context(session_id)` — assemble full context payload for a live session; includes `user_memory`, `user_personality`, constraints, health signals, active skill index.
- `record_outcome(event_type, entity_id, notes)` — log a durable outcome event.
- `flag_location(place_id, reason)` — permanently avoid a place for this user.
- `set_alarm(timestamp, type, payload)` — schedule a DO alarm for a future ambient action.

**Domain-specific tools:**
- `fetch_recipes(query, filters)` — semantic search over the user's saved recipe history.
- `run_illness_detective(symptom_onset_hours)` — rank probable food culprits from recent history cross-referenced with active recalls.
- `generate_meal_plan(days, use_inventory)` — build a minimum-spend meal plan from current inventory.
- `check_medication_interactions(ingredients)` — check a list of ingredients against `user_memory` `health.medications` entries.

## Skills System

Skills and tools are two different things. Tools are executable functions (code that runs — `scan_product`, `write_memory`, `check_medication_interactions`). Skills are reusable instruction sets — markdown text stored in the `skills` SQLite table that the AI loads on demand.

The agent is not pre-programmed with a fixed set of behaviors. It has a growing library of skills it has learned, and it decides which skill is relevant for each task by reading a compact index injected into its system prompt.

### Skills Table (in DO SQLite)

```
skills: name, description, content (markdown), tags (JSON), source (system|user), status (active|stale|archived),
        use_count, last_used_at, archived_reason, created_at, updated_at
```

- `description` is one line — this is the only part shown in the index (cheap, always injected).
- `content` is full markdown — only loaded when the AI calls `skill_view(name)`.
- `use_count` increments on every load — the foundation of skill evolution.
- `source`: `system` = bundled skills Brioela ships with (cooking coach, allergy detection, illness detective, etc.); `user` = skills the agent created itself from conversations. The Curator only ever touches `user` skills. System skills are never modified or archived automatically.
- `status`: three states — `active` (in the index), `stale` (Curator flagged it as long-unused, still in index but deprioritized), `archived` (excluded from the index entirely).

### Skill Selection: Index-Then-Load

Every system prompt includes a skills index built dynamically from the skills table:

```
## Available skills
Before replying, scan this list. If one matches your current task, call skill_view(name) first.

- cooking-coach: Step-by-step voice cooking methodology with intervention logic
- allergy-detection: Behavioral inference workflow for detecting and confirming allergens
- illness-detective: Food history analysis procedure for foodborne illness investigation
- recipe-reconstruction: Multi-speaker session technique for capturing grandma-style recipes
- medication-awareness: Drug-food interaction checking workflow
```

The model reads this, recognizes the relevant skill by its one-line description, and calls `skill_view(name)` to load the full markdown content into context. The full content is only loaded when needed. The index costs ~2–3 tokens per skill regardless of how long the skill content is.

This is how Hermes works. Not vector search. The model understands intent; cosine similarity understands proximity. They are not the same. A skill description like "allergy detection workflow" will be correctly identified by the model for a user saying "I think I reacted to something I ate" — vector search might return the wrong skill at 0.82 similarity.

### When the Agent Creates a Skill

The AI decides autonomously. There is no threshold, no automatic trigger, no external system telling it to create a skill. The agent recognizes a repeatable pattern mid-conversation — a workflow it improvised that worked, a procedure it wants to remember, a technique it derived from a session — and calls `skill_create` on its own judgment.

This is explicitly not rule-based. The model sees the conversation, recognizes that what just happened is worth preserving as a reusable procedure, and acts. No developer logic decides when this fires. The agent's reasoning does.

Example: a user has a grandma cooking session that produces a novel spice-layering technique the agent had to improvise. After the session, the agent calls `skill_create("ethiopian-spice-layering", "Technique for building berbere-style spice depth in three stages", <full markdown procedure>)`. Next time it encounters a similar recipe, it sees this in the index and loads it.

### Skill Evolution

Skills are not static. The agent improves them over time:

- `skill_update(name, content, reason)` — rewrites a skill when it found a better approach. Called after a session where it improvised something that outperformed the existing instructions.
- `use_count` increments on every `skill_view` call. Index is ordered by `use_count` — the most-used skills appear first, reducing prompt scan time.

A skill that starts as a rough outline after one session becomes a precise, tested procedure after a hundred. The agent builds its own library from experience.

### The Curator

The Curator is a background maintenance pass that runs automatically against user-created skills. It keeps the skill library clean and prevents it from accumulating noise.

**What it does:**
- Tracks how often each skill is viewed and used.
- Moves long-unused skills through the lifecycle: `active` → `stale` → `archived`.
- Runs a short auxiliary model pass that reads all user skills and proposes consolidations: if two skills cover overlapping territory, the Curator proposes merging them and calls `skill_update` or `skill_archive` accordingly.
- Patches drift: if a skill's instructions reference a workflow that has since changed (e.g., an API the agent no longer uses), the Curator flags it for review.

**When it runs:**
The Curator is triggered by a DO alarm — not a cron daemon. On every Orchestrator DO wake, it checks two conditions:
1. Has enough time passed since the last Curator run? (Default interval: 7 days.)
2. Has the agent been idle long enough that running now won't interrupt active work? (Default: 2+ hours since last user interaction.)

If both conditions are true, the Curator runs. Otherwise it schedules itself again at the next alarm cycle.

```typescript
async alarm() {
  const lastCuratorRun = await this.ctx.storage.get('curator_last_run')
  const lastActivity = await this.ctx.storage.get('last_activity')
  const now = Date.now()

  const curatorDue = !lastCuratorRun || (now - lastCuratorRun) > CURATOR_INTERVAL_MS
  const agentIdle = !lastActivity || (now - lastActivity) > CURATOR_MIN_IDLE_MS

  if (curatorDue && agentIdle) {
    await this.runCurator()
    await this.ctx.storage.put('curator_last_run', now)
  }

  // reschedule next check
  await this.ctx.storage.setAlarm(now + CURATOR_CHECK_INTERVAL_MS)
}
```

**What the Curator never touches:**
System skills (`source = 'system'`) — the bundled skills Brioela ships with (cooking coach, allergy detection, illness detective, recipe reconstruction, medication awareness). These are permanent. The Curator only manages skills the agent itself created.

### Skill Deduplication on Create (Background, Not Hot Path)

When `skill_create` is called, a background QStash job embeds the new skill's description via Cloudflare Vectorize and checks for semantic near-duplicates. If a similar skill exists, the agent is prompted to merge or update rather than create a duplicate. This is a write-path background check — never on the retrieval path.

## Context Injection into Live Sessions

When a cooking session starts, the Orchestrator DO builds a context payload: user name, hard allergies, active dislikes, dietary identity, current recipe with steps, prior notes on this recipe, relevant behavioral patterns, recent negative outcomes, and the skills index. This is injected into Gemini Live as system instructions at session connect time. Changes during the session are pushed into the live WebSocket via `send_realtime_input`.

## Memory Domains in the Orchestrator DO SQLite

The Orchestrator DO is not just a food database. It holds every dimension of what the agent knows about this user:

| Domain | What it holds | Schema type |
|---|---|---|
| `food_memory` | scan history, recipe history, meal logs, negative outcomes | structured |
| `constraint_memory` | allergies, dislikes, dietary identity, boycott filters | structured |
| `behavioral_patterns` | stress eating signals, sickness correlations, time-of-day patterns | structured |
| `medical_conditions` | declared or inferred conditions (spec 28) | structured |
| `user_memory` | all declarative facts about the user — categorized (health, diet, location, relationships, preferences, personality), key/value/confidence/source — replaces the old `medication_profile` and `lifestyle_memory` | structured with AI-written values |
| `user_personality` | AI-inferred personality traits — trait name, evidence array, strength score; never predefined by a developer; agent decides what traits exist from patterns over time | unstructured (AI-authored traits) |
| `health_signals` | stool photos, glucose readings, symptom logs (spec 34) | structured |
| `location_memory` | visited places, inferred travel context, home city | structured |
| `session_history` | cooking session summaries, grandma style profiles | structured |
| `session_archive` | cold-tier archived turns from compressed sessions — FTS5-indexed, searchable via recall_session_context | structured |
| `skills` | reusable procedural instruction sets in markdown — name, description, content, tags, use_count | structured |

**The core distinction across all domains**: `user_memory` and `user_personality` hold *who the user is* (declarative facts and personality traits). `skills` holds *how to serve the user* (procedural instructions). These must never be conflated. A medication detected from a photo → fact in `user_memory`. The agent deciding to create a procedure for handling medication questions → entry in `skills`. Most visual intake produces only memory updates. Skills are rare, earned from patterns, created by the agent's own judgment.

## Memory Namespace System

All declarative user facts write through one tool — `memory_update` — into one table — `user_memory`. The namespace is a dot-separated string the AI chooses. The design has two layers working together: **the AI sees existing namespaces before deciding** (intelligence) and **the code enforces hard constraints regardless** (enforcement). Neither alone is enough.

### The SQLite Table

```sql
CREATE TABLE user_memory (
  id          TEXT PRIMARY KEY,    -- "${namespace}:${key}"
  namespace   TEXT NOT NULL,       -- dot-separated, max 3 levels: "health.medications"
  key         TEXT NOT NULL,       -- specific item within namespace: "metformin", "visited_japan"
  value       TEXT NOT NULL,       -- JSON object — never a bare string
  confidence  REAL NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL,       -- 'image' | 'conversation' | 'inferred' | 'cron'
  active      INTEGER DEFAULT 1,   -- 0 = deactivated by user or agent
  read_count  INTEGER DEFAULT 0,   -- times this entry was injected into a prompt
  write_count INTEGER DEFAULT 0,   -- times this entry was written/updated with new evidence
  last_read   INTEGER,             -- timestamp of last prompt injection
  last_write  INTEGER,             -- timestamp of last write
  updated_at  INTEGER NOT NULL
);
```

**`read_count` vs `write_count` are different signals and the curator uses both differently:**

- High read, low write = very valuable, core memory — never touch. (Medication entry: written once from one photo, read 200 times in every health conversation.)
- Low read, low write, old `last_write` = candidate for archival. (A one-time observation never used again.)
- High write, rising confidence = actively reinforced fact — healthy, keep it.
- Written recently (within 14 days), not yet read much = new entry, give it time — grace period, curator never touches it.

### The Zod Schema (Tool Boundary Enforcement)

```typescript
const MemoryEntrySchema = z.object({
  namespace: z.string()
    .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/)
    // enforces: lowercase only, dot-separated, max 3 levels deep
    // rejects:  "Health.Medications" (uppercase), "a.b.c.d.e" (too deep)
    // allows:   "health.medications", "life.places", "diet"
    .max(48),
  key: z.string()
    .regex(/^[a-z][a-z0-9_-]*$/)
    .max(64),
  value: z.record(z.string(), z.unknown()), // JSON object, never bare string
  confidence: z.number().min(0).max(1).default(1.0),
  source: z.enum(['image', 'conversation', 'inferred', 'cron']),
})
```

The regex on `namespace` is the first physical constraint. Zod rejects malformed namespaces at the tool boundary before anything touches SQLite. The AI cannot create uppercase namespaces, cannot nest deeper than 3 levels, cannot write a bare string as a value.

### The `memory_update` Tool (Full Implementation)

```typescript
memory_update: tool({
  description: 'Write or update a fact about the user. Always check the existing namespace list in the system prompt first — extend existing namespaces before creating new ones.',
  parameters: MemoryEntrySchema,
  execute: async ({ namespace, key, value, confidence, source }) => {

    // ENFORCEMENT LAYER 1: namespace format already rejected by Zod above

    // ENFORCEMENT LAYER 2: hard cap — prevents namespace explosion
    const { count } = await this.db
      .select({ count: sql<number>`count(distinct namespace)` })
      .from(userMemory)
      .get()

    const namespaceExists = await this.db
      .select({ id: userMemory.id })
      .from(userMemory)
      .where(eq(userMemory.namespace, namespace))
      .limit(1)
      .get()

    if (!namespaceExists && count >= 40) {
      // self-correcting rejection: return the list so AI can retry with existing namespace
      const list = await this.getNamespaceList()
      return `REJECTED: namespace cap reached (${count}/40). Use an existing namespace:\n${list}`
    }

    // MERGE: load existing entry and merge — never overwrite, never lose old data
    const existing = await this.db
      .select()
      .from(userMemory)
      .where(and(
        eq(userMemory.namespace, namespace),
        eq(userMemory.key, key),
      ))
      .get()

    const mergedValue = existing
      ? { ...JSON.parse(existing.value), ...value }  // spread merge: old keys preserved, new keys added, changed keys updated
      : value

    await this.db
      .insert(userMemory)
      .values({
        id: `${namespace}:${key}`,
        namespace, key,
        value: JSON.stringify(mergedValue),
        confidence, source,
        updatedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: userMemory.id,
        set: {
          value: JSON.stringify(mergedValue),
          confidence,
          writeCount: sql`write_count + 1`,  // increment on every update
          lastWrite: Date.now(),
          updatedAt: Date.now(),
        },
      })

    return `memory updated: ${namespace}.${key}`
  },
})
```

**The merge logic** is the critical piece. The AI never needs to read old data before writing. The execute function handles it:

```
First photo (metformin 500mg):
  existing = null
  stored   = { dose: "500mg", frequency: "2x daily" }

Second photo (refill, 1000mg):
  existing = { dose: "500mg", frequency: "2x daily" }
  new      = { dose: "1000mg", refill_date: "2026-06-01" }
  merged   = { dose: "1000mg", frequency: "2x daily", refill_date: "2026-06-01" }
              ↑ updated        ↑ preserved              ↑ added
```

Old keys are never lost. New keys are added. Changed keys are updated. The AI writes only what it observed right now; the code handles the rest.

### `loadMemoryForPrompt()` — Read Count as a Side Effect

Most memory reads are passive — namespaces are loaded into the system prompt automatically every turn, not via explicit tool calls. The read count must be incremented here, not inside a tool, because the AI never "asks" to read this memory — it just has it.

```typescript
async loadMemoryForPrompt(namespaces: string[]): Promise<MemoryEntry[]> {
  const entries = await this.db
    .select()
    .from(userMemory)
    .where(inArray(userMemory.namespace, namespaces))
    .all()

  // fire and forget — never await, never block the response
  this.db.update(userMemory)
    .set({
      readCount: sql`read_count + 1`,
      lastRead: Date.now(),
    })
    .where(inArray(userMemory.namespace, namespaces))
    .run() // no await — this is a background write

  return entries
}
```

This runs every time a session context is assembled. The increment is a side effect of normal operation — zero extra developer action required. Over weeks, the counts naturally reflect actual usage. The curator reads these counts and knows what matters.

### Option A — AI Sees Existing Namespaces (Intelligence Layer)

The existing namespace list is injected into every system prompt. The AI reads it before writing and chooses an existing namespace wherever possible. This is the intelligence side.

```typescript
async buildMemoryContext(): Promise<string> {
  const namespaces = await this.db
    .selectDistinct({ namespace: userMemory.namespace })
    .from(userMemory)
    .all()

  if (namespaces.length === 0) return ''

  const list = namespaces.map(n => `- ${n.namespace}`).join('\n')

  return `
## Existing memory namespaces (always extend these before creating new ones):
${list}

Rules:
- Pick the closest existing namespace first
- Only create a new one if nothing fits
- Max 3 dot levels: category.subcategory.detail
- All lowercase, no spaces, no uppercase ever
`
}
```

The AI sees `["health.medications", "diet.restrictions", "life.places"]` and immediately picks `health.medications` for a new medication photo. No new namespace is created. No developer intervention. Just the AI making an informed choice because it has the information it needs.

### Option B — Hard Enforcement (Code Layer)

The hard cap at 40 namespaces and the Zod regex run regardless of what the AI intends. If the AI is confused, the code stops it. If the rejection happens, the error message returns the current namespace list so the AI can self-correct and retry without human involvement:

```
REJECTED: namespace cap reached (40/40). Use an existing namespace:
- health.medications
- diet.restrictions
- life.places
...
```

The AI reads the rejection, picks the right namespace, retries. One round trip, no human needed.

### Typing at Read Time

At write time, `value` is `Record<string, unknown>` — that is honest TypeScript, not lazy TypeScript. The AI invents content; you cannot know it at compile time. At read time, when you consume a specific namespace in a known UI context, you cast with a specific schema:

```typescript
// When showing the medications screen:
const MedicationValue = z.object({
  dose: z.string().optional(),
  frequency: z.string().optional(),
  refill_date: z.string().optional(),
})

const meds = await db.select().from(userMemory)
  .where(eq(userMemory.namespace, 'health.medications'))
  .all()

const parsed = meds.map(m => ({
  key: m.key,
  data: MedicationValue.safeParse(JSON.parse(m.value)),
}))
```

Zod enforces the envelope at the write boundary. You enforce the content schema at the specific UI boundary where you know what you are reading. Everything in between is legitimately `unknown`.

## Data Boundaries

- Per-user Orchestrator DO SQLite: all memory domains listed above. Private. Never in shared databases.
- CookingAgent DO: ephemeral session state. Flushed after session closes and key facts written to Orchestrator.
- Shared data (product corpus, community notes, map): Supabase Postgres. Readable by Workers. Never stored in DO.
- Cache: Upstash Redis. TTL-bound, disposable.

## API Surface

- `POST /api/agent/events` — receive any product event, route to correct Orchestrator DO via RPC.
- `GET /api/agent/context` — return user's memory context for session initialization.
- Internal DO-to-DO RPC: CookingAgent DO calls Orchestrator DO for context and emits events back.

## Success Metrics

- Agent wake latency (p50, p95).
- Event processing success rate.
- Alarm fire accuracy (fires at correct time, correct action taken).
- Async job delivery and completion rate via QStash and Workflow.
- Memory fact accumulation over user lifetime.
- Day-7 retention rate — if below 15%, the ambient loop is not landing.
