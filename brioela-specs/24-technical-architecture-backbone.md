# 24. Technical Architecture Backbone

## Overview

Brioela runs entirely on managed, serverless infrastructure. No self-managed servers. No DevOps. Every component is either a Cloudflare product, a managed cloud service, or a third-party managed API. The architecture is designed for a solo founder building a global consumer product.

## Layer Map

```
Mobile / PWA clients
       ↓ HTTP + WebSocket
Cloudflare Workers (Hono.js routing)
       ↓ DO RPC
Per-User Agent DO (CF Agent SDK)
       ↓ QStash publish
Upstash QStash → Upstash Workflow (async multi-step jobs)
       ↓ cache reads
Upstash Redis (product cache, rate limits, session state)
       ↓ shared reads/writes
Cloudflare D1 or Supabase Postgres (global shared data)

Live cooking sessions:
Mobile clients → LiveKit Cloud (WebRTC SFU)
                      ↓ audio + video frames
               Gemini Live (gemini-live-2.5-flash-preview)
                      ↓ transcript + events
               CookingAgent DO ← injects user memory from Orchestrator DO
                      ↓ async
               Upstash Workflow (summarize, save recipe, update memory)
```

## Component Decisions and Reasons

### Cloudflare Workers + Hono.js (API Layer)

All HTTP routing runs on Cloudflare Workers using Hono.js as the framework. Hono is fast, type-safe, and built for the Workers runtime. Every API endpoint defined in the feature specs routes through here. Workers are stateless — they call into DOs for user-specific state and into shared databases for global data.

Workers handle: authentication, request validation, rate limiting, routing to the correct DO or database, and response shaping.

### Cloudflare Agent SDK + Durable Objects (Per-User Agent Brain)

Each Brioela user has exactly one persistent agent instance implemented using the Cloudflare Agent SDK (the `agents` npm package). This builds on top of Durable Objects and provides: structured state management, built-in SQLite storage per agent, WebSocket support, RPC methods, and self-scheduling.

The Hermes architecture principle applies here: each user's agent is fully isolated, self-contained, and owns all private data for that user. It does not share state, tooling, or execution context with any other user's agent. This is the opposite of a pooled or shared agent model. One user's agent failure or computation never touches another user.

The agent has two conceptual roles:
- **Orchestrator DO**: long-lived, always exists per user, holds SQLite personal memory (scan history, preferences, recipes, constraints, patterns, negative outcomes). This is the permanent brain.
- **CookingAgent DO**: activated per cooking session, holds live session state (current recipe, step index, participant list, transcript accumulation, real-time context window). Fires events back to the Orchestrator DO on session events. After session ends, it summarizes and writes durable facts back to the Orchestrator DO via Upstash Workflow.

The Orchestrator DO injects memory context into every active session (allergies, dislikes, prior patterns, current recipe) and receives event callbacks from all product features.

### Gemini Live (Voice + Vision AI Brain)

Model: `gemini-live-2.5-flash-preview` (full-duplex, single model, audio + video + text simultaneously).

Gemini Live replaces the previous Grok Voice consideration. Reasons: natively processes video frames and audio in the same model (Grok Voice is audio-only), Google's global infrastructure has far more regional presence than xAI's US+EU only setup, and pricing at audio-only sessions ($0.0045/min) is substantially cheaper than Grok Voice ($0.05/min) while providing more capability.

Technical specs:
- Audio input: raw 16-bit PCM at 16kHz little-endian.
- Video input: JPEG or PNG frames, max 1 frame per second, max 768×768 pixels.
- Audio output: raw 16-bit PCM at 24kHz little-endian.
- Session control: WebSocket.
- Context injection: system instructions at session connect time carrying user memory (allergies, preferences, current recipe, cooking style).
- Mid-session context push: supported via `send_realtime_input` with text key when session state changes (new step, allergy match detected, etc.).
- Barge-in: fully supported — model knows when to shut up and when a mid-sentence user utterance is a correction vs. a filler.
- thinkingLevel: configurable per session. Use `minimal` for ambient cooking questions (fastest response). Use `low` or `medium` for complex substitution or technique questions.

Cost model:
- Audio only (voice assistant without camera): ~$0.0045/min.
- Audio + video (live vision cooking coach with camera on): ~$0.051/min.
- Vision-on sessions are premium-tier only due to cost.

### LiveKit Cloud (Real-Time Media Transport)

LiveKit Cloud is the managed WebRTC SFU. Not self-hosted — LiveKit manages servers, scaling, regions, reconnection, and encryption. Used only for multi-person cooking sessions and the live vision cooking coach feature.

LiveKit owns: audio and video track routing between participants, SFU management, session presence, room lifecycle.
LiveKit does NOT own: AI reasoning, memory, recipe state, business logic.

Cost: $0.0005/minute per participant. A 45-minute grandma cooking session with grandma + parent + child + AI = 4 participants × $0.0005 × 45 = $0.09 total LiveKit cost. Negligible against Gemini Live cost for the same session.

The LiveKit Agent Worker is a separate Node.js process (not a Cloudflare Worker — LiveKit Agents SDK requires Node.js). It runs on managed infrastructure such as Railway or Fly.io and connects to LiveKit Cloud rooms as an AI participant. It pulls user memory context from the Cloudflare Worker endpoint before joining a room, relays audio/video between LiveKit and Gemini Live, and fires transcript events back to the CookingAgent DO for memory updates.

Single-user voice sessions (no room, no multiple participants) do NOT use LiveKit. They connect directly to Gemini Live via WebSocket from the client, with context injected from the per-user Orchestrator DO at session start.

### Upstash QStash (Async Job Delivery)

QStash is used for all fire-and-forget background jobs where guaranteed delivery and retry behavior are required. Examples: triggering recipe import processing after a URL is shared, triggering receipt OCR after a photo is captured, triggering weekly summary generation, triggering pattern detection after scan events accumulate. HTTP-based, serverless, no queue infrastructure to manage.

### Upstash Redis (Cache and Rate Limits)

Redis is used for: product lookup caching (resolved products cached to avoid repeated Open Food Facts calls), community note hot cache per geohash, rate limiting per user per feature, scan deduplication, active session tracking.

### Upstash Workflow (Durable Multi-Step Execution)

Upstash Workflow provides durable, step-by-step execution for complex async jobs that must not be lost if a step fails. Used for: recipe import pipeline (fetch source → extract transcript → normalize recipe → confidence check → save), receipt processing pipeline (OCR → merchant resolve → line item match → spend summary update), post-cooking session summarization (compile transcript → extract recipe steps → merge into memory → notify user).

### Product Data Sources

- Open Food Facts: primary source, 3.3M+ products globally, free, open license.
- Country-specific government food databases: supplementary, injected by country based on user location at scan time.
- Product cache: resolved products cached in Upstash Redis with TTL to reduce repeated lookups.
- Pending scans: products that cannot be resolved are stored as pending for later enrichment when databases update.

## Data Boundary Rules

- Private data (personal memory, constraints, scan history, recipes, patterns): lives only in the per-user Orchestrator DO's SQLite. Never in shared databases. Never accessible by other users or by workers without an authenticated RPC call to that user's DO.
- Shared data (product corpus, community notes, map places, business profiles): lives in shared Cloudflare D1 or Supabase Postgres. Readable by any worker. Writable only through validated API paths.
- Cached data: Upstash Redis. TTL-bound. Treated as disposable.
- Ephemeral session data: CookingAgent DO. Flushed after session closes and key facts are written to Orchestrator DO.

## What Runs Where

| Component | Runtime | Who manages it |
|---|---|---|
| API routing | Cloudflare Workers (Hono.js) | Cloudflare |
| Per-user agent brain | Cloudflare Durable Objects (Agent SDK) | Cloudflare |
| Async job delivery | Upstash QStash | Upstash |
| Durable workflows | Upstash Workflow | Upstash |
| Cache and rate limits | Upstash Redis | Upstash |
| Shared relational data | Cloudflare D1 or Supabase Postgres | Cloudflare / Supabase |
| Real-time media rooms | LiveKit Cloud | LiveKit |
| LiveKit agent worker | Railway or Fly.io | Managed PaaS |
| AI voice + vision | Gemini Live | Google |
| Product data | Open Food Facts + gov DBs | External |

## Non-Functional Requirements

- Zero self-managed servers anywhere in the stack.
- Any component failure must not cascade to other users (per-user isolation at DO level).
- Idle users cost effectively zero (DOs hibernate, QStash only charges on messages).
- All user-private data must remain inside the per-user DO boundary and be deletable on user account deletion without touching shared tables.
