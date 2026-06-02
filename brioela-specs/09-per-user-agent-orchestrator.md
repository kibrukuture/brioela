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

## Agent Tool Set

- `read_memory(domain, key)` — read from personal SQLite.
- `write_memory(domain, key, value, confidence)` — write or update a fact.
- `propose_constraint(type, value, evidence)` — create a constraint candidate.
- `confirm_constraint(constraint_id)` — mark confirmed.
- `schedule_job(type, payload, delay)` — push to Upstash QStash.
- `start_workflow(type, payload)` — start an Upstash Workflow.
- `get_session_context(session_id)` — build full context payload for a session.
- `record_outcome(event_type, entity_id, notes)` — log outcome events.
- `flag_location(place_id, reason)` — permanently avoid a place for this user.
- `set_alarm(timestamp, type, payload)` — schedule a DO alarm.

## Context Injection into Live Sessions

When a cooking session starts, the Orchestrator DO builds a context payload: user name, hard allergies, active dislikes, dietary identity, current recipe with steps, prior notes on this recipe, relevant behavioral patterns, recent negative outcomes. This is injected into Gemini Live as system instructions at session connect time. Changes during the session are pushed into the live WebSocket via `send_realtime_input`.

## Data Boundaries

- Per-user Orchestrator DO SQLite: personal memory, derived facts, scan history, recipes, patterns, negative outcomes. Private. Never in shared databases.
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
