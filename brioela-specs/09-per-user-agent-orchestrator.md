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

**Memory and constraint tools:**
- `read_memory(domain, key)` — read a fact from personal SQLite.
- `write_memory(domain, key, value, confidence)` — persist or update a durable fact.
- `write_lifestyle_memory(key, value, confidence)` — write a free-form lifestyle/personality observation; key and value are AI-authored, no predetermined schema.
- `propose_constraint(type, value, evidence)` — create an unconfirmed constraint candidate (allergy, dislike, dietary identity).
- `confirm_constraint(constraint_id)` — mark a proposed constraint as confirmed.
- `schedule_job(type, payload, delay)` — fire a one-shot background job via Upstash QStash.
- `start_workflow(type, payload)` — start a durable multi-step flow via Upstash Workflow.
- `get_session_context(session_id)` — assemble the full context payload for a live session; includes all memory domains: food, constraints, lifestyle, medications, health signals.
- `record_outcome(event_type, entity_id, notes)` — log a durable outcome event.
- `flag_location(place_id, reason)` — permanently avoid a place for this user.
- `set_alarm(timestamp, type, payload)` — schedule a DO alarm for a future ambient action.
- `classify_visual_intake(image_bytes)` — classify a submitted photo, decide relevance and domain, route to memory or discard; see spec 34.
- `activate_skill(skill_name, payload)` — unlock a dormant capability set (e.g., Medication Skill on first prescription photo).
- `fetch_recipes(query, filters)` — semantic search over the user's saved recipe history.
- `run_illness_detective(symptom_onset_hours)` — rank probable food culprits from recent history cross-referenced with active recalls.
- `generate_meal_plan(days, use_inventory)` — build a minimum-spend meal plan from current inventory.
- `check_medication_interactions(ingredients)` — check a list of ingredients against the active medication profile.

## Skills System

Skills and tools are two different things. Tools are executable functions (code that runs — `scan_product`, `write_memory`, `check_medication_interactions`). Skills are reusable instruction sets — markdown text stored in the `skills` SQLite table that the AI loads on demand.

The agent is not pre-programmed with a fixed set of behaviors. It has a growing library of skills it has learned, and it decides which skill is relevant for each task by reading a compact index injected into its system prompt.

### Skills Table (in DO SQLite)

```
skills: name, description, content (markdown), tags (JSON), use_count, archived (boolean), archived_reason, created_at, updated_at
```

- `description` is one line — this is the only part shown in the index (cheap, always injected).
- `content` is full markdown — only loaded when the AI calls `skill_view(name)`.
- `use_count` increments on every load — the foundation of skill evolution.
- `archived` skills are excluded from the index and never shown in the system prompt, but their content remains in SQLite for inspection or restoration.

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

### Skill Evolution

Skills are not static. The agent can improve them:

- `skill_create(name, description, content)` — extracts a new reusable pattern from a conversation and saves it to the skills table. The agent calls this when it identifies a workflow that should be repeatable.
- `skill_update(name, content, reason)` — rewrites an existing skill when a better approach was found. The agent calls this after a session where it improvised something that worked better than the current instructions.
- `use_count` is incremented on every `skill_view` call. Skills ordered by use_count in the index — most-used appear first.

The agent builds and refines its own skill library. A skill that starts as a rough outline after the first cooking session becomes a precise, battle-tested procedure after a hundred sessions.

### Skill Deduplication (Background, Not Hot Path)

When `skill_create` is called, a background job embeds the new skill's description via Cloudflare Vectorize and checks for semantic near-duplicates. If a similar skill already exists, the agent is prompted to merge or update rather than create noise. This is a write-path background check — not part of skill retrieval.

## Context Injection into Live Sessions

When a cooking session starts, the Orchestrator DO builds a context payload: user name, hard allergies, active dislikes, dietary identity, current recipe with steps, prior notes on this recipe, relevant behavioral patterns, recent negative outcomes, and the skills index. This is injected into Gemini Live as system instructions at session connect time. Changes during the session are pushed into the live WebSocket via `send_realtime_input`.

## Memory Domains in the Orchestrator DO SQLite

The Orchestrator DO is not just a food database. It holds every dimension of what the agent knows about this user:

| Domain | What it holds | Schema type |
|---|---|---|
| `food_memory` | scan history, recipe history, meal logs, negative outcomes | structured (Drizzle schema) |
| `constraint_memory` | allergies, dislikes, dietary identity, boycott filters | structured |
| `behavioral_patterns` | stress eating signals, sickness correlations, time-of-day patterns | structured |
| `medical_conditions` | declared or inferred conditions (spec 28) | structured |
| `medication_profile` | detected medications, active drug-food interaction skill (spec 34) | structured |
| `health_signals` | stool photos, glucose readings, symptom logs (spec 34) | structured |
| `lifestyle_memory` | free-form AI-written observations (dog, gym, baby, garden, travel context) | unstructured (key/value/confidence) |
| `location_memory` | visited places, inferred travel context, home city | structured |
| `session_history` | cooking session summaries, grandma style profiles | structured |
| `skills` | reusable instruction sets in markdown — name, description, content, tags, use_count | structured |

`lifestyle_memory` is the only unstructured domain. The agent writes its own keys and values with no predetermined schema. This is intentional — it allows the agent to learn new things about the user that no human could anticipate at design time.

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
