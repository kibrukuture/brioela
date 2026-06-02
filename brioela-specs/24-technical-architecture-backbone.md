# 24. Technical Architecture Backbone

## Overview

Brioela runs entirely on managed, serverless infrastructure. No self-managed servers. No DevOps. Every component is either a Cloudflare product, a managed cloud service, or a third-party managed API. The architecture is designed for a solo founder building a global consumer product.

## Layer Map

```
Mobile / PWA clients
       ↓ HTTP + WebSocket
Cloudflare Workers (Hono.js routing — single codebase, one wrangler.toml)
       ↓ DO RPC via idFromName(userId)
BrioelOrchestrator DO (CF Agent SDK, Drizzle + SQLite, per-user brain)
       ↓ QStash publish / Workflow start
Upstash QStash (one-shot fire-and-forget jobs)
Upstash Workflow (multi-step durable flows with waitForEvent)
       ↓ cache reads
Upstash Redis (product cache, rate limits, session deduplication)
       ↓ shared reads/writes
Supabase Postgres (global shared data: products, community notes, map, businesses)

Live cooking sessions (multi-person):
Mobile clients → LiveKit Cloud (WebRTC SFU, managed)
                      ↓ audio stream + video frames
               Gemini Live (gemini-3.1-flash-live-preview)
               [LiveKit Agent Worker: Node.js on Railway/Fly.io]
                      ↓ transcript + events (HTTP back to CF Worker)
               CookingAgent DO ← pulls context from Orchestrator DO
                      ↓ async
               Upstash Workflow (summarize, save recipe, update memory)

Single-user voice sessions (no room):
Mobile client → Gemini Live WebSocket directly
             ← context injected from Orchestrator DO at session start
```

## Component Decisions

### Cloudflare Workers + Hono.js (API Layer)

All HTTP routing runs on Cloudflare Workers using Hono.js. Single codebase, single `wrangler.toml`. Your Hono Worker, your Durable Object classes, and your Agent classes all live in the same repo and deploy together with `wrangler deploy`.

```typescript
// src/index.ts
import { Hono } from 'hono'
import { BrioelOrchestrator } from './agents/orchestrator'
import { CookingAgent } from './agents/cooking'

const app = new Hono<{ Bindings: Env }>()

app.post('/scan', async (c) => {
  const userId = c.req.header('x-user-id')!
  const id = c.env.ORCHESTRATOR.idFromName(userId)
  const orchestrator = c.env.ORCHESTRATOR.get(id)
  return orchestrator.fetch(c.req.raw)
})

export default app
export { BrioelOrchestrator, CookingAgent } // must export all DO classes
```

Workers are stateless — born per request, die per request. They are the front door that routes traffic into the correct user's DO.

### Cloudflare Agent SDK + Durable Objects (Per-User Brain)

Each user has one `BrioelOrchestrator` DO instance — addressed by `idFromName(userId)`. Uses the Cloudflare Agent SDK (`@cloudflare/agents` package), which is an abstraction built on top of the raw Durable Object primitive. The Agent class extends DurableObject — there is no separate "Agent SDK process." It is the DO.

SQLite via Drizzle ORM:
```typescript
export class BrioelOrchestrator extends Agent {
  db = drizzle(this.ctx.storage, { schema })
  // this.ctx.storage is CF's built-in DO storage, always present
  // Drizzle wraps it with full type-safe SQL interface
}
```

wrangler.toml must declare `new_sqlite_classes` to provision SQLite (not just KV):
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelOrchestrator"]
```

DO capabilities used by Brioela:
- **SQLite via Drizzle**: full SQL, type-safe schema, migrations, 10GB limit, unlimited rows.
- **KV storage**: also available via `this.ctx.storage.get/put` for simple key-value access.
- **Alarms**: `this.ctx.storage.setAlarm(timestamp)` — DO wakes itself at a future time. The core mechanism for ambient intelligence (weekly summaries, pattern detection, travel pre-load, sickness follow-up) without any cron jobs. Each alarm event triggers `async alarm()` on the DO.
- **WebSocket hibernation**: DO holds WebSocket connections open and hibernates between messages at zero cost. Wakes in milliseconds on message arrival. This is how 2-hour cooking sessions work within the CPU limits.
- **CPU time**: 30 seconds per request, configurable to 5 minutes. But each WebSocket message is its own event with a fresh CPU budget — a 2-hour session is thousands of tiny events, each ~50-100ms CPU, total active CPU well under 5 minutes.
- **FTS5 full-text search**: built into DO SQLite. Used for searching user scan history and recipe notes without external search.
- **Data Studio**: SQLite-backed DOs are viewable and editable in the Cloudflare dashboard. Critical for debugging individual user memory state.
- **Storage limit**: 10GB per DO, unlimited rows. A heavy user's complete lifetime data realistically stays under 50MB.

### AI Model: Gemini Live (Voice + Vision Brain)

Model: `gemini-3.1-flash-live-preview`

This is a single full-duplex model that simultaneously hears audio, sees video frames, reads injected text context, and speaks back. No separate STT → LLM → TTS pipeline. One WebSocket, one brain.

Key capabilities:
- **Full-duplex**: receives audio and produces audio simultaneously.
- **Native video**: processes JPEG/PNG frames alongside audio in the same reasoning pass. No duct-taping a separate vision model.
- **Barge-in**: model recognizes user interruption mid-response and treats it as a correction or question, not noise.
- **thinkingLevel**: `minimal` (lowest latency, for cooking questions), `low`/`medium` (for complex technique or substitution questions).
- **Affective dialogue**: natively interprets tone, emotion, and pace from raw audio. Can de-escalate frustration and adopt empathetic tone. Useful for cooking sessions where stress is normal.
- **Context injection**: system instructions at session connect time (user memory, allergies, recipe, style). Mid-session context updates via `send_realtime_input` text key.

Audio specs:
- Input: raw 16-bit PCM, 16kHz, little-endian.
- Output: raw 16-bit PCM, 24kHz, little-endian.
- LiveKit handles these conversions automatically.

Video specs:
- JPEG or PNG frames, max 1 fps, max 768×768 pixels.
- Brioela sends 1 frame every 2-4 seconds by default to reduce cost.

Cost model:
- Audio input: 25 tokens/sec → $0.0045/min (at $3.00/M tokens).
- Audio + video: 283 tokens/sec → $0.051/min.
- Audio-only is 10× cheaper than Grok Voice. Vision-on is comparable to Grok Voice but Gemini actually sees the video.

Why Gemini over Grok Voice for Brioela: Grok Voice wins on task-completion benchmarks (67.3% vs 43.8% τ-voice) and raw latency (0.78s vs 0.96s), but Grok Voice is audio-only. Brioela's cooking coach requires the AI to watch the camera. Gemini is the only full-duplex model with native video support. Grok is not used.

### LiveKit Cloud (Real-Time Media Transport)

Used only for multi-person cooking sessions. Not self-hosted — LiveKit Cloud manages servers, SFU, scaling, regions, reconnection, and encryption.

LiveKit owns: audio and video track routing between participants, room lifecycle, SFU management.
LiveKit does NOT own: AI reasoning, memory, business logic, recipe state.

Cost: $0.0005/min per participant. A 45-min grandma session (4 participants) = $0.09 total LiveKit cost.

The LiveKit Agent Worker is a separate Node.js process — it cannot run inside a Cloudflare Worker. LiveKit's Agents SDK requires Node.js runtime. This worker deploys on Railway or Fly.io (managed PaaS). It connects to LiveKit Cloud rooms as an AI participant, pulls user context from the Cloudflare Worker endpoint before joining, relays audio/video to Gemini Live, and fires transcript events back to the CookingAgent DO via HTTP.

Single-user voice sessions do NOT use LiveKit. The client connects directly to Gemini Live via WebSocket, with context injected by the Orchestrator DO at session start.

### Upstash QStash (One-Shot Async Delivery)

For fire-and-forget background jobs: guaranteed delivery, retries on failure, no state between steps. Use when there is one step or when steps are fully independent. Examples: send push notification, trigger product enrichment fetch, fan out to multiple endpoints, schedule a delayed message.

### Upstash Workflow (Durable Multi-Step Execution)

Built on top of QStash. Adds multi-step state and `waitForEvent`. Use when steps depend on each other or you need to pause indefinitely for an external trigger.

Your code (Cloudflare Worker) runs each step. Upstash owns the orchestration state between steps — carries accumulated context, handles retries, resumes after `waitForEvent`. Upstash does NOT run your logic on their servers. One HTTP call into your Worker per step.

Example for Brioela:
```
scan happens
→ step 1: deep product analysis (retries if fails)
→ step 2: cross-check user allergen SQLite in DO
→ step 3: waitForEvent("community_note_added") ← zero cost, just a stored record
→ step 4: notify user with full context from steps 1+2
```

Upstash Box was evaluated as an alternative for running per-user agents. Decision: rejected. Upstash Box is managed compute that cannot provide geographic edge co-location. Cloudflare DOs automatically provision close to the user's first request, giving sub-100ms wake times. For real-time scan personalization, edge proximity matters. Upstash is used for QStash, Workflow, and Redis only.

### Upstash Redis

Serverless Redis. Used for: product lookup cache (resolved products cached with TTL to reduce Open Food Facts calls), community note hot cache per geohash, rate limiting per user per feature, scan deduplication, active session token tracking.

### Supabase Postgres (Global Shared Data)

Flat monthly pricing. Used for all shared, cross-user data:
- Product corpus (canonical products, ingredients, nutrition, origin).
- Community notes.
- Map places and sightings.
- Business and practitioner profiles.
- Featured listings.

Not used for any user-private data. User-private data lives exclusively in the per-user Orchestrator DO's SQLite.

### Product Data Sources

- Open Food Facts: primary, 3.3M+ products globally, free.
- Country-specific government food databases: supplementary, selected by user's current location geo at scan time.
- Resolved products cached in Upstash Redis with TTL.
- Unresolvable scans stored as pending in Supabase for later enrichment.

## Data Boundary Rules

- **Private** (personal memory, constraints, scan history, recipes, patterns): Orchestrator DO SQLite only. Never in Supabase. Never accessible without authenticated RPC to that user's DO.
- **Shared** (product corpus, community notes, map, businesses): Supabase Postgres. No user PII.
- **Cached**: Upstash Redis. TTL-bound, disposable.
- **Ephemeral session**: CookingAgent DO. Flushed after session closes and key facts written to Orchestrator DO.

## What Runs Where

| Component | Runtime | Who manages it |
|---|---|---|
| API routing | Cloudflare Workers (Hono.js) | Cloudflare |
| Per-user agent brain | Cloudflare Durable Objects (CF Agent SDK) | Cloudflare |
| Semantic search over user data (RAG) | Cloudflare Vectorize | Cloudflare |
| One-shot async jobs | Upstash QStash | Upstash |
| Multi-step durable flows | Upstash Workflow | Upstash |
| Cache + rate limits | Upstash Redis | Upstash |
| Global shared data | Supabase Postgres | Supabase |
| Real-time media rooms | LiveKit Cloud | LiveKit |
| LiveKit AI agent worker | Railway or Fly.io (Node.js) | Managed PaaS |
| AI voice + vision | Gemini Live (gemini-3.1-flash-live-preview) | Google |
| Product data | Open Food Facts + gov DBs | External |

## The Hard Parts You'll Actually Hit

These are not theoretical. They are the failure modes a production agent system hits in order, roughly as the user base grows. Handle them before they become fires.

### 1. Context Compression

Long-running agents accumulate conversation history. A 45-minute grandma cooking session with a busy multi-speaker transcript will exceed Gemini Live's context window if raw history is injected naively. Hermes solves this with a dedicated `context_compressor.py` that summarizes middle turns when message count exceeds a threshold.

Brioela's equivalent: a `compressHistory()` method on the `BrioelOrchestrator` DO.

```typescript
async compressHistory() {
  const messages = await this.db.select().from(sessionMessages)
    .where(eq(sessionMessages.sessionId, this.activeSessionId))
    .orderBy(asc(sessionMessages.createdAt))

  if (messages.length <= COMPRESSION_THRESHOLD) return

  // keep first N (system context) and last M (recent turns) verbatim
  const middleTurns = messages.slice(KEEP_HEAD, messages.length - KEEP_TAIL)

  // summarize the middle with a cheap model call (not Gemini Live — use standard Gemini Flash text)
  const summary = await summarizeWithCheapModel(middleTurns)

  // replace middle turns with single summary row
  await this.db.delete(sessionMessages)
    .where(inArray(sessionMessages.id, middleTurns.map(m => m.id)))
  await this.db.insert(sessionMessages).values({
    sessionId: this.activeSessionId,
    role: 'system',
    content: `[compressed: ${summary}]`,
    createdAt: middleTurns[0].createdAt,
  })
}
```

This fires automatically when `messages.length > N` during any session. Without it, long sessions hit context limits and the agent starts hallucinating or ignoring earlier context. The summary is stored back to DO SQLite so it survives a DO eviction and reconnect.

### 2. Skill Selection via AI Tool Calling (Not Pre-Injection)

The agent has many capabilities: food scan analysis, allergy checking, recipe reranking, medication interaction checking, travel pre-load, illness detection, visual intake classification, and more. The wrong approach is pre-selecting which skills to inject into the context before the AI sees the request — that requires you to predict what the AI will need, which is exactly the kind of decision the AI is better at than you.

The correct approach: **register all skills as callable tools and let the AI decide what to call.**

This is the same pattern as Vercel AI SDK's `tools` parameter — you define tool schemas upfront, pass them all to the model, and the model calls whichever ones it needs based on what is actually happening in the conversation. No pre-filtering. No embedding similarity step. The model's own reasoning determines relevance.

```typescript
import { Agent } from '@cloudflare/agents'
import { tool } from 'ai' // Vercel AI SDK tool helper, works in CF Workers
import { z } from 'zod'

export class BrioelOrchestrator extends Agent {

  // All skills are registered as tools. The AI calls what it needs.
  tools = {
    scanProduct: tool({
      description: 'Analyze a scanned product against the user\'s full constraint profile. Returns verdict, allergen flags, community notes.',
      parameters: z.object({ productId: z.string(), geoHash: z.string() }),
      execute: async ({ productId, geoHash }) => this.runScanAnalysis(productId, geoHash),
    }),

    checkMedicationInteractions: tool({
      description: 'Check if any ingredients conflict with the user\'s active medications.',
      parameters: z.object({ ingredients: z.array(z.string()) }),
      execute: async ({ ingredients }) => this.checkDrugFoodInteractions(ingredients),
    }),

    fetchRecipes: tool({
      description: 'Search the user\'s saved recipes or suggest new ones matching a query.',
      parameters: z.object({ query: z.string(), maxResults: z.number().optional() }),
      execute: async ({ query, maxResults }) => this.queryRecipes(query, maxResults ?? 5),
    }),

    classifyVisualInput: tool({
      description: 'Classify a photo submitted by the user. Decide domain, update memory, activate skills if needed.',
      parameters: z.object({ imageBase64: z.string() }),
      execute: async ({ imageBase64 }) => this.routeVisualIntake(imageBase64),
    }),

    detectIllnessSuspects: tool({
      description: 'Given a symptom report, rank the most probable food culprits from the user\'s recent history.',
      parameters: z.object({ symptomOnsetHours: z.number() }),
      execute: async ({ symptomOnsetHours }) => this.runIllnessDetective(symptomOnsetHours),
    }),

    generateMealPlan: tool({
      description: 'Generate a 7-day meal plan from current fridge inventory, minimizing spend.',
      parameters: z.object({ days: z.number().default(7) }),
      execute: async ({ days }) => this.buildMealPlan(days),
    }),

    writeLongTermMemory: tool({
      description: 'Persist a durable fact about the user to SQLite memory.',
      parameters: z.object({ domain: z.string(), key: z.string(), value: z.string(), confidence: z.number() }),
      execute: async (args) => this.persistMemoryFact(args),
    }),

    // ... all other skills follow the same pattern
  }
}
```

When a user says "I feel sick, what did I eat last night" — the AI calls `detectIllnessSuspects`. When a photo comes in — it calls `classifyVisualInput`. When the cooking session needs a recipe — it calls `fetchRecipes`. The AI chains tool calls as needed: fetch the recipe, then check medication interactions against its ingredients, then write a note to long-term memory. All decided by the model, not pre-programmed logic.

**Why this is better than pre-injecting skill descriptions:**
- The AI sees all tool schemas but only executes what it actually needs — no wasted context on irrelevant skill descriptions.
- The AI can chain tools in sequences a developer would not have anticipated.
- Tool schemas (Zod) are self-documenting — the AI reads the `description` field to understand when to call each tool.
- No embedding infrastructure needed for skill selection. Cloudflare Vectorize is reserved for semantic search over the user's personal data (recipe history, scan history) — not for skill routing.
- Adding a new skill is one `tool({})` definition. No retraining, no re-embedding, no threshold recalibration.

### 3. DO Cold Wake Latency (Eviction During Streaming)

Durable Objects can be evicted by the Cloudflare runtime during periods of low activity or during long-running operations. This is the most subtle production failure: the DO wakes up, starts streaming a Gemini Live response, the stream takes 30+ seconds, and the DO is evicted mid-flight. The client gets a dropped connection.

The solution is a `keepAlive()` heartbeat using DO alarms:

```typescript
// fires an alarm every 20 seconds to prevent eviction during long operations
keepAliveWhile(streamPromise: Promise<any>) {
  const heartbeat = async () => {
    await this.ctx.storage.setAlarm(Date.now() + 20_000)
  }
  heartbeat() // set first alarm immediately
  return streamPromise.finally(() => {
    // clear heartbeat on stream completion
    this.ctx.storage.deleteAlarm()
  })
}

// usage — wrap any long-running operation:
await this.keepAliveWhile(this.streamGeminiLiveResponse(payload))
```

The alarm fires every 20 seconds, which counts as activity and prevents eviction. The alarm handler is a no-op — its only purpose is to keep the DO alive. On stream completion (success or error), the alarm is cleared.

This pattern is required for: Gemini Live streaming sessions, long Upstash Workflow waitForEvent pauses, any external API call that takes more than a few seconds.

### 4. Sub-Agent Delegation via DO-to-DO RPC

The Orchestrator DO does not do everything itself. For specialized heavy tasks — RAG retrieval over recipe history, database-heavy pattern analysis, bulk scan enrichment — it delegates to sub-agent DOs addressed by a deterministic name pattern:

```
${userId}-rag      → RAG retrieval agent (searches recipe + scan history)
${userId}-db       → database query agent (complex aggregation queries)
${userId}-enrich   → product enrichment agent (fetches from Open Food Facts, normalizes)
```

The parent Orchestrator calls them via `stub.fetch()`:

```typescript
const ragId = env.BRIOELA_ORCHESTRATOR.idFromName(`${userId}-rag`)
const ragAgent = env.BRIOELA_ORCHESTRATOR.get(ragId)
const result = await ragAgent.fetch(new Request('https://internal/query', {
  method: 'POST',
  body: JSON.stringify({ query: 'find recipes with eggplant', topK: 5 }),
}))
const recipes = await result.json()
```

**Sub-agent DO design rule**: sub-agents are stateless-ish. They read from shared storage (Supabase, Upstash Redis) and from the parent's context passed in the request payload. Their own DO SQLite is ephemeral scratch space — used within the task, not persisted long-term. Durable facts they produce go back to the Orchestrator DO, not into the sub-agent's own SQLite. This keeps the Orchestrator as the single source of truth for the user's memory and prevents state fragmentation across DOs.

The parent never awaits a sub-agent for more than the user's request timeout allows. If a sub-agent task is too slow for inline response, the parent fires it via QStash and collects the result in a follow-up alarm.

### 5. Architectural Validation

The one DO per user decision is the right one. This is worth stating explicitly because it is the foundation every other decision builds on.

**You get for free**:
- **Location affinity**: the DO provisions geographically close to where the user first requests it. A user in Lagos gets an agent running near Lagos. A user in Seoul gets one near Seoul. No configuration — Cloudflare handles it.
- **Zero-cost hibernation**: idle DOs cost nothing. A user who scans once a week and does nothing else incurs effectively zero compute cost between scans.
- **Per-user memory isolation**: one user's orchestrator is physically incapable of touching another user's SQLite. Not access-controlled — literally different SQLite files.
- **Consistent addressing**: `idFromName(userId)` always returns the same DO instance. No session management, no routing table, no distributed lock.

The only architectural risk is data gravity — if a user's DO accumulates a very large SQLite (realistically >1GB), and the Cloudflare edge node that owns it goes away, there is a migration delay. This is an edge case the platform handles, but worth monitoring per-user storage size in production and alerting if any single DO exceeds 500MB.
