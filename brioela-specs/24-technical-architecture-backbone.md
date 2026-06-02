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
| One-shot async jobs | Upstash QStash | Upstash |
| Multi-step durable flows | Upstash Workflow | Upstash |
| Cache + rate limits | Upstash Redis | Upstash |
| Global shared data | Supabase Postgres | Supabase |
| Real-time media rooms | LiveKit Cloud | LiveKit |
| LiveKit AI agent worker | Railway or Fly.io (Node.js) | Managed PaaS |
| AI voice + vision | Gemini Live (gemini-3.1-flash-live-preview) | Google |
| Product data | Open Food Facts + gov DBs | External |
