# 24. Technical Architecture Backbone

## Overview

Brioela runs entirely on managed, serverless infrastructure. No self-managed servers. No DevOps. Every component is either a Cloudflare product, a managed cloud service, or a third-party managed API. The architecture is designed for a solo founder building a global consumer product.

## Layer Map

```
Mobile / PWA clients
       ↓ HTTP + WebSocket
Cloudflare Workers (Hono.js routing — single codebase, one wrangler.toml)
       ↓ DO RPC via idFromName(userId)
BrioelaBrain DO (CF Agent SDK, Drizzle + SQLite, per-user brain)
       ↓ QStash publish / Workflow start
Upstash QStash (one-shot fire-and-forget jobs)
Upstash Workflow (multi-step durable flows with waitForEvent)
       ↓ cache reads
Upstash Redis (product cache, rate limits, session deduplication)
       ↓ shared reads/writes
Supabase Postgres (global shared data: products, community notes, map, businesses)

Mira live sessions (cooking scene, multi-person):
Mobile clients → Cloudflare Realtime / RealtimeKit room
                       ↓ WebSocket adapter delivers PCM audio + JPEG frames
                Mira session DO ← pulls context from Brain DO
                       ↓ Gemini Live (gemini-3.1-flash-live-preview)
                       ↓ async
                Cloudflare/agent workflow path (summarize, save recipe, update memory)

Single-user voice sessions (no room):
Mobile client → Gemini Live WebSocket directly
             ← context injected from Brain DO at session start
```

## Component Decisions

### Cloudflare Workers + Hono.js (API Layer)

All HTTP routing runs on Cloudflare Workers using Hono.js. Single codebase, single `wrangler.toml`. Your Hono Worker, your Durable Object classes, and your Agent classes all live in the same repo and deploy together with `wrangler deploy`.

```typescript
// src/index.ts
import { Hono } from 'hono'
import { BrioelaBrain } from './agents/brain'
import { MiraSession } from './agents/mira'

const app = new Hono<{ Bindings: Env }>()

app.post('/scan', async (c) => {
  const userId = c.get('userId') // derived from Supabase bearer token middleware
  const id = c.env.BRAIN.idFromName(userId)
  const brain = c.env.BRAIN.get(id)
  return brain.fetch(c.req.raw)
})

export default app
export { BrioelaBrain, MiraSession } // must export all DO classes
```

Workers are stateless — born per request, die per request. They are the front door that routes traffic into the correct user's DO.

### Cloudflare Agent SDK + Durable Objects (Per-User Brain)

Each user has one `BrioelaBrain` DO instance — addressed by `idFromName(userId)`. Uses the Cloudflare Agents SDK (`agents` package), which is an abstraction built on top of the raw Durable Object primitive. The Agent class extends DurableObject — there is no separate "Agent SDK process." It is the DO.

SQLite via Drizzle ORM:
```typescript
export class BrioelaBrain extends Agent {
  db = drizzle(this.ctx.storage, { schema })
  // this.ctx.storage is CF's built-in DO storage, always present
  // Drizzle wraps it with full type-safe SQL interface
}
```

wrangler.toml must declare `new_sqlite_classes` to provision SQLite (not just KV):
```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelaBrain"]
```

DO capabilities used by Brioela:
- **SQLite via Drizzle**: full SQL, type-safe schema, migrations, 10GB limit, unlimited rows.
- **KV storage**: also available via `this.ctx.storage.get/put` for simple key-value access.
- **Alarms**: `this.ctx.storage.setAlarm(timestamp)` — DO wakes itself at a future time. The core mechanism for ambient intelligence (weekly summaries, behavior pattern detection, travel pre-load, sickness follow-up) without any cron jobs. Each alarm event triggers `async alarm()` on the DO.
- **WebSocket hibernation**: DO holds WebSocket connections open and hibernates between messages at zero cost. Wakes in milliseconds on message arrival. This is how 2-hour cooking sessions work within the CPU limits.
- **CPU time**: 30 seconds per request, configurable to 5 minutes. But each WebSocket message is its own event with a fresh CPU budget — a 2-hour session is thousands of tiny events, each ~50-100ms CPU, total active CPU well under 5 minutes.
- **FTS5 full-text search**: built into DO SQLite. Used for searching user scan history and recipe notes without external search.
- **Data Studio**: SQLite-backed DOs are viewable and editable in the Cloudflare dashboard. Critical for debugging individual user memory state.
- **Storage limit**: 10GB per DO, unlimited rows. A heavy user's complete lifetime data realistically stays under 50MB.

### Per-User SQLite Migration Runtime

Brain SQLite migrations are distributed runtime events, not a single central deploy event. Every user has a physically isolated SQLite database, so a schema rollout can touch millions of Brains over time as each Durable Object wakes.

Hard rule: Drizzle's `__drizzle_migrations` proves SQL files were applied, but Brioela readiness proves the user's Brain is safe to serve.

The Brain startup path must use the migration runtime described in `build-guide/05-brain/08-brain-sqlite-migration-runtime.md`:

- typed migration manifest bundled with the Worker
- per-Brain migration lock
- rollout control plane with canaries, percentages, and kill switch
- lazy migration on safe wake-up moments
- smoke tests against the user's actual SQLite
- readiness states such as `ready`, `migrating`, `migration_failed`, and `blocked_by_control_plane`
- expand/dual-write/backfill/verify/contract for dangerous changes

No Brain serves normal reads, writes, Mira context, callable RPC, alarm work, or child-agent dispatch while readiness is unsafe. This is especially important at scale: a migration must be safe when it runs for the first internal canary Brain and when it runs months later for a rarely active user's Brain.

### AI Model: Gemini Live (Mira Voice + Vision Runtime)

Model: `gemini-3.1-flash-live-preview`

This is a single full-duplex model that simultaneously hears audio, sees video frames, reads injected text context, and speaks back. No separate STT → LLM → TTS pipeline. One live model session, one Mira runtime.

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
- Mobile and RealtimeKit adapters handle these conversions at the transport boundary.

Video specs:
- JPEG or PNG frames, max 1 fps, max 768×768 pixels.
- Brioela sends 1 frame every 2-4 seconds by default to reduce cost.

Cost model:
- Audio input: 25 tokens/sec → $0.0045/min (at $3.00/M tokens).
- Audio + video: 283 tokens/sec → $0.051/min.
- Audio-only is 10× cheaper than Grok Voice. Vision-on is comparable to Grok Voice but Gemini actually sees the video.

Why Gemini over Grok Voice for Brioela: Grok Voice wins on task-completion benchmarks (67.3% vs 43.8% τ-voice) and raw latency (0.78s vs 0.96s), but Grok Voice is audio-only. Mira in the cooking scene requires the AI to watch the camera. Gemini is the only full-duplex model with native video support. Grok is not used.

### Cloudflare Realtime / RealtimeKit (Real-Time Media Transport)

Used for live cooking sessions and multi-person rooms. RealtimeKit handles room lifecycle,
participants, media transport, reconnection, and client SDK behavior. Its WebSocket adapter sends
PCM audio and periodic JPEG frames directly to the Mira session DO, where Gemini Live receives the
model input.

RealtimeKit owns: participant room state, media routing, reconnect behavior, and client transport.
RealtimeKit does not own: AI reasoning, user memory, recipe state, constraints, safety policy, or
post-session writes.

Single-user voice sessions can use the same Cloudflare Worker + Mira session lifecycle with the
minimum transport needed for the session. Context is injected from the Brain DO at session
start.

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

Not used for any user-private data. User-private data lives exclusively in the per-user Brain DO's SQLite.

### Product Data Sources

- Open Food Facts: primary, 3.3M+ products globally, free.
- Country-specific government food databases: supplementary, selected by user's current location geo at scan time.
- Resolved products cached in Upstash Redis with TTL.
- Unresolvable scans stored as pending in Supabase for later enrichment.

## Data Boundary Rules

- **Private** (personal memory, constraints, scan history, recipes, patterns): Brain DO SQLite only. Never in Supabase. Never accessible without authenticated RPC to that user's DO.
- **Shared** (product corpus, community notes, map, businesses): Supabase Postgres. No user PII.
- **Cached**: Upstash Redis. TTL-bound, disposable.
- **Ephemeral live session**: Mira session DO. Flushed after session closes and key facts written to Brain DO.

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
| Real-time media rooms | Cloudflare Realtime / RealtimeKit | Cloudflare |
| AI voice + vision | Gemini Live (gemini-3.1-flash-live-preview) | Google |
| Product data | Open Food Facts + gov DBs | External |

## The Hard Parts You'll Actually Hit

These are not theoretical. They are the failure modes a production agent system hits in order, roughly as the user base grows. Handle them before they become fires.

### 1. Context Compression

Long-running agents accumulate conversation history. A 45-minute grandma cooking session with a busy multi-speaker transcript will exceed Gemini Live's context window if raw history is injected naively. Naive compression — "summarize everything and drop it" — is the wrong answer. It loses exactly the things that matter: hard constraints stated early, exact measurements, the reasoning behind decisions, implicit preferences the user demonstrated but never declared.

The smart compressor does three things in order: **extract facts into durable memory before compressing**, **protect what is sacred**, **summarize the rest**. Information does not disappear — it migrates tiers.

#### The Three Storage Tiers

```
Tier 1 — Hot (in context window)
  Verbatim turns: sacred block + recent N turns

Tier 2 — Warm (in context window, compressed)
  Structured summaries replacing middle turns
  Still in the active context, but dense

Tier 3 — Cold (DO SQLite, out of context)
  Archived raw turns + their extracted facts
  Searchable via recall_session_context tool
  Agent can page these back into context if needed
```

The agent never loses information. It moves information from hot → warm → cold. Cold storage is still reachable — if the agent needs something from an archived turn, it calls `recall_session_context(query)` and gets it back.

#### The Sacred Block — Never Compressed Under Any Circumstances

Some content is re-injected into the system prompt at every step regardless of what compression did to the rest of the history:

- **Hard allergy and safety flags**: if a user mentioned an allergen mid-session, that fact is in the sacred block forever.
- **Active medical conditions and medications**: from the user's DO profile, re-injected at session start and never overwritten by compression.
- **Session initialization context**: the recipe being cooked, current step index, participant constraint summaries (for multi-person rooms).
- **Any active recall alert**: if a recall was flagged during the session, it stays in context.
- **First 3 turns verbatim**: system prompt + initial user request + first AI response. These define the session's purpose and must never be summarized away.

Sacred block content is assembled once and stored as a separate `sacred_context` field on the session record in DO SQLite. Every compression pass regenerates the active context as: `sacred_block + compressed_middle + recent_tail`. The sacred block is immune.

#### Dual-Layer Trigger (Hermes Pattern)

Two thresholds, deliberately offset so they don't fire simultaneously:

**Layer 1 — Proactive compressor (fires at 50% context usage)**

```typescript
async maybeCompress(currentTokenCount: number, contextLimit: number) {
  const usage = currentTokenCount / contextLimit

  if (usage < 0.50) return // nothing to do

  // Phase 1: prune tool results first — zero LLM cost
  // Replace old tool call outputs >200 chars with a placeholder
  await this.pruneToolResults()

  // Phase 2: extract facts from compressible turns BEFORE touching them
  // This is the Mem0 insight — information migrates to SQLite, never disappears
  await this.extractFactsFromMiddle()

  // Phase 3: summarize the middle turns with a cheap model
  await this.summarizeMiddle()
}
```

**Layer 2 — Safety net (fires at 85% context usage)**

The safety net fires only if Layer 1 did not bring usage below the safe range. It is more aggressive: archives everything except `protect_first_n = 3` turns and `protect_last_n = 20` turns, regardless of content. This is the last resort before the context window overflows.

Never let usage reach 95%. At 95% the model starts degrading — ignoring early context, hallucinating constraints, losing recipe step state. The safety net at 85% exists precisely to prevent this.

#### Phase 2: Extract Before Compress (The Key Step)

Before any turn is summarized or archived, the compressor runs a structured extraction pass over the turns about to be compressed. This is the Mem0 pattern — convert raw conversation into structured durable facts before discarding the raw turn.

What gets extracted and written to DO SQLite memory:

| Pattern in the turn | Extracted as |
|---|---|
| User states a preference ("I hate cilantro") | `constraint_memory` — soft dislike |
| User mentions equipment limit ("no blender") | `session_context.equipment_constraints` |
| User mentions technique ("I'm using a smaller pan") | `session_context.active_overrides` |
| User mentions feeling unwell mid-session | `health_signals` event |
| AI confirms a step was completed | `recipe_state.completed_steps[]` |
| User says they stopped taking a medication | `user_memory` `health.medications` entry set to `active = false` |
| Grandma demonstrates a technique | `cook_style_profile` signal |

This extraction runs on the cheap model — a single structured JSON output call against each turn marked for compression. The extracted facts persist in SQLite. The raw turn can then be safely summarized or archived. The information lives on, just in a more durable form.

#### Phase 3: Summarize the Middle

After fact extraction, the middle turns are summarized in chunks. The summary model is cheap and fast — standard Gemini Flash text, not Gemini Live.

```typescript
async summarizeMiddle() {
  const messages = await this.db.select().from(sessionMessages)
    .where(and(
      eq(sessionMessages.sessionId, this.activeSessionId),
      eq(sessionMessages.compressible, true),
    ))
    .orderBy(asc(sessionMessages.createdAt))

  if (messages.length === 0) return

  // summary budget: 20% of the compressed content's token size (Hermes formula)
  const summaryBudget = Math.floor(estimateTokens(messages) * 0.20)

  const summary = await cheapModel.generate({
    prompt: COMPRESSION_PROMPT, // structured template: goals, constraints, decisions, progress, what not to forget
    content: messages.map(m => m.content).join('\n'),
    maxTokens: summaryBudget,
  })

  // archive the raw turns to cold storage
  await this.db.update(sessionMessages)
    .set({ status: 'archived', archivedAt: Date.now() })
    .where(inArray(sessionMessages.id, messages.map(m => m.id)))

  // write the summary as a warm-tier turn
  await this.db.insert(sessionMessages).values({
    sessionId: this.activeSessionId,
    role: 'system',
    content: `[summary of ${messages.length} turns]: ${summary}`,
    status: 'warm',
    createdAt: messages[0].createdAt,
  })
}
```

The summary template always asks for: the active goal at that point, any constraints mentioned, decisions made and why, what step the recipe was at, and "what must not be forgotten." This last item is the most important — it forces the model to surface the things naive summarization would drop.

#### The `recall_session_context` Tool (Cold Storage Paging)

Once turns are archived, the agent can still access them. This is the MemGPT pattern — cold storage is not a black hole, it is a searchable library.

```typescript
recall_session_context: tool({
  description: 'Search archived session turns when you need something from earlier in this conversation that may have been compressed.',
  parameters: z.object({
    query: z.string().describe('what you are looking for'),
    sessionId: z.string().optional(),
  }),
  execute: async ({ query, sessionId }) => {
    // FTS5 search over archived session turns
    return this.db.select()
      .from(sessionMessages)
      .where(and(
        eq(sessionMessages.status, 'archived'),
        sql`sessionMessages MATCH ${query}`, // FTS5
      ))
      .limit(5)
      .all()
  },
})
```

The agent calls this when it realizes it needs context it does not have — "I think the user mentioned something about their pan size earlier." It retrieves the relevant archived turns and can act on them without them needing to be live in the context window.

#### What Naive Compression Loses (and This Design Does Not)

Five categories that disappear in naive summarization, all preserved by this design:

1. **Exact numeric values** — measurements, temperatures, timings. These are extracted as structured facts before summarization. "350°F for 20 minutes" does not become "cooked at appropriate temperature."
2. **Hard constraints stated early** — "I'm out of butter." This becomes an `equipment_constraint` fact in SQLite before the turn is compressed.
3. **Decision reasoning** — why the AI chose a substitution. Preserved in the summary template's "decisions made and why" field.
4. **Cross-turn dependencies** — step 3 depended on something established in step 1. The sacred block's recipe state tracks this.
5. **Implicit preferences** — the user never said they hate overcooking, but they reacted negatively twice to suggestions that involved long cook times. These behavioral signals are extracted as `constraint_memory` entries before the turns are compressed.

#### Session compressor vs. Brain compressor

The **Mira session DO** runs the live-session compressor described above — it manages live session history for cooking sessions.

The **BrioelaBrain DO** runs a simpler version for its own long-running ambient history (multi-day context across many interactions). It uses the same fact-extraction pattern but fires less frequently — triggered by the DO alarm cycle, not by real-time token usage. Its compression target is the `ambient_history` table, not an active session's `sessionMessages` table.

### 2. Skill Selection: Tools + Index-Then-Load (Not Vector Search)

There are two distinct things here that must not be conflated: **tools** and **skills**. They work differently and serve different purposes.

**Tools** are executable functions — code that runs. They are registered with Zod schemas using the Vercel AI SDK `tool()` pattern. The AI calls them when it needs to do something: scan a product, check medication interactions, fetch a recipe, write to memory. The model sees all tool schemas at all times and decides which to call based on the full conversation context.

**Skills** are reusable instruction sets — markdown stored in SQLite. They are things like a complete cooking coach methodology, a structured allergy detection workflow, a step-by-step illness investigation procedure. The AI reads a compact index of all available skills in the system prompt, decides which skill is relevant for the current task, and loads the full skill content on demand via `skill_view()` — itself a tool call.

This is how Hermes actually works. Not vector search. The model reads the index and uses its own reasoning to decide relevance. The model understands intent; a cosine similarity score understands proximity. They are not the same thing.

#### The Tools Layer (Vercel AI SDK)

```typescript
export class BrioelaBrain extends Agent {
  tools = {
    // Executable capabilities — AI calls these to do things
    skill_view: tool({
      description: 'Load the full instructions for a named skill. Call this first when a skill in the index matches your current task.',
      parameters: z.object({
        name: z.string().describe('exact skill name from the skills index'),
      }),
      execute: async ({ name }) => {
        const skill = await this.db.select().from(skills)
          .where(eq(skills.name, name)).get()
        if (!skill) return `Skill "${name}" not found`
        // increment use_count — powers skill evolution over time
        await this.db.update(skills)
          .set({ useCount: sql`use_count + 1` })
          .where(eq(skills.name, name))
        return skill.content // full markdown, now injected into context
      },
    }),

    skill_create: tool({
      description: 'Save a new reusable skill learned from this conversation.',
      parameters: z.object({
        name: z.string(),
        description: z.string().describe('one line — this is what appears in the index'),
        content: z.string().describe('full skill instructions in markdown'),
        tags: z.array(z.string()),
      }),
      execute: async ({ name, description, content, tags }) => {
        await this.db.insert(skills).values({
          name, description, content,
          tags: JSON.stringify(tags), useCount: 0, createdAt: Date.now(),
        })
        return `Skill "${name}" created and added to index`
      },
    }),

    skill_update: tool({
      description: 'Improve an existing skill based on what just worked or failed.',
      parameters: z.object({
        name: z.string(),
        content: z.string().describe('updated full skill content in markdown'),
        reason: z.string().describe('what changed and why'),
      }),
      execute: async ({ name, content }) => {
        await this.db.update(skills)
          .set({ content, updatedAt: Date.now() })
          .where(eq(skills.name, name))
        return `Skill "${name}" updated`
      },
    }),

    scan_product: tool({
      description: 'Analyze a scanned product against this user\'s full constraint profile.',
      parameters: z.object({ productId: z.string(), geoHash: z.string() }),
      execute: async (args) => this.runScanAnalysis(args),
    }),

    check_medication_interactions: tool({
      description: 'Check a list of ingredients against the user\'s active medications.',
      parameters: z.object({ ingredients: z.array(z.string()) }),
      execute: async (args) => this.checkMedicationFoodInteractions(args),
    }),

    memory_update: tool({
      description: 'Write or update a fact about the user. Always check the existing namespace list first — extend existing namespaces before creating new ones.',
      parameters: z.object({
        namespace: z.string().regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/).max(48),
        key: z.string().regex(/^[a-z][a-z0-9_-]*$/).max(64),
        value: z.record(z.string(), z.unknown()),
        confidence: z.number().min(0).max(1).default(1.0),
        source: z.enum(['image', 'conversation', 'inferred', 'cron']),
      }),
      execute: async (args) => this.memoryUpdate(args), // merge logic + cap enforcement in impl
    }),

    // ... all other executable capabilities follow this pattern
  }
}
```

#### The Skills Index (System Prompt Layer)

The skills index is a small text block — just name + one-line description per skill — assembled dynamically from the `skills` SQLite table and injected into every system prompt. Ordered by `use_count` so the most-used skills appear first.

```typescript
async buildSystemPrompt(): Promise<string> {
  const allSkills = await this.db
    .select({ name: skills.name, description: skills.description })
    .from(skills)
    .orderBy(desc(skills.useCount))
    .all()

  const skillsIndex = allSkills.length > 0 ? `
## Available skills
Before replying, scan this list. If one matches your current task, call skill_view(name) first.

${allSkills.map(s => `- ${s.name}: ${s.description}`).join('\n')}
` : ''

  return `${BRIOELA_IDENTITY_PROMPT}

${memoryBlock}
${skillsIndex}
Current time: ${new Date().toISOString()}`
}
```

The index costs almost nothing in tokens — 2–3 tokens per skill. A user with 30 skills uses ~90 tokens for the full index. The full skill content (potentially hundreds of lines of markdown) is only ever loaded when the AI explicitly calls `skill_view(name)`. This is the point: the model reads the index, recognizes the relevant skill by its description, and fetches only what it needs.

**Why the model outperforms vector search here:**

A user says "my JWT is expiring too early." Vector search might return `code-review` at cosine 0.82 and `auth-patterns` at 0.71 — and inject the wrong one because similarity ≠ intent. The model reads the index and calls `skill_view("auth-patterns")` immediately because it understands the sentence, not just the proximity of embeddings.

**Skills are also self-improving.** The `use_count` increment on every `skill_view` call is the seed of a GEPA-like evolution loop: the agent can call `skill_update` when a skill worked better than before, and `skill_create` to extract a new reusable pattern from a conversation. The agent builds its own skill library over time without developer intervention.

**Where Cloudflare Vectorize actually belongs:** not skill retrieval — skill deduplication. When the agent calls `skill_create`, a background job embeds the new skill's description and checks Vectorize for semantic near-duplicates before writing. If something similar exists, the agent merges or updates rather than creating noise. This is a background write path, not a hot read path.

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

The Brain DO does not do everything itself. For specialized heavy tasks — RAG retrieval over recipe history, database-heavy pattern analysis, bulk scan enrichment — it delegates to sub-agent DOs addressed by a deterministic name pattern:

```
${userId}-rag      → RAG retrieval agent (searches recipe + scan history)
${userId}-db       → database query agent (complex aggregation queries)
${userId}-enrich   → product enrichment agent (fetches from Open Food Facts, normalizes)
```

The parent Brain calls them via `stub.fetch()`:

```typescript
const ragId = env.BRAIN.idFromName(`${userId}-rag`)
const ragAgent = env.BRAIN.get(ragId)
const result = await ragAgent.fetch(new Request('https://internal/query', {
  method: 'POST',
  body: JSON.stringify({ query: 'find recipes with eggplant', topK: 5 }),
}))
const recipes = await result.json()
```

**Sub-agent DO design rule**: sub-agents are stateless-ish. They read from shared storage (Supabase, Upstash Redis) and from the parent's context passed in the request payload. Their own DO SQLite is ephemeral scratch space — used within the task, not persisted long-term. Durable facts they produce go back to the Brain DO, not into the sub-agent's own SQLite. This keeps the Brain as the single source of truth for the user's memory and prevents state fragmentation across DOs.

The parent never awaits a sub-agent for more than the user's request timeout allows. If a sub-agent task is too slow for inline response, the parent fires it via QStash and collects the result in a follow-up alarm.

### 5. The Brain maintenance Uses the Alarm System (Not a Cron)

The Brain maintenance (the background skill maintenance pass described in spec 09) runs on the same DO alarm mechanism as all other ambient features — not a separate cron job or scheduled function. Every alarm wake checks two conditions before running the Brain maintenance: enough time elapsed since the last run, and the agent has been idle long enough. If both are true, the Brain maintenance runs as part of the normal `alarm()` handler.

This means no additional infrastructure for the Brain maintenance. It is a pure DO alarm — zero cost while waiting, fires exactly when conditions are met, and requires no external scheduler. The same pattern used for the weekly food summary, the travel pre-load, and sickness follow-up is the pattern that powers the Brain maintenance.

The implication: every user's skill library gets quietly maintained over time purely as a side effect of DO alarms that were already in place.

### 6. Offline Behavior and Sync Queue

Brioela is a heavily online app. Most of its intelligence requires a live connection: the Brain DO runs in Cloudflare's edge, AI calls go to Gemini, community data lives in Supabase. There is no "offline mode" in the sense of a fully functional disconnected app.

However, the core use case — scanning a product at a grocery store — happens in environments with unreliable or absent cell signal. The app must handle this gracefully.

**What works offline (client-side only):**
- Camera can open and capture an image or video.
- Barcode decode from the camera frame runs locally using the device's native barcode API — no network call required to extract the UPC.
- Previously cached product results (stored in the client after prior scans) can display instantly for products the user has scanned before.
- The pending scan is queued locally on the device.

**What requires connectivity:**
- Resolving a new UPC against the product database.
- Running the AI verdict (drug interactions, personalization, health scoring).
- Writing to the Brain DO (scan event, memory update).
- Ground find submission.
- Voice and live vision sessions — these are impossible offline and display a clear connection state indicator.

**The queue contract:**
When the app detects no connectivity, scans and visual intake submissions are written to a local device queue (IndexedDB on PWA, SQLite on native). When connectivity resumes:
1. The queue is drained in FIFO order.
2. Each item is submitted to the Brain DO as a normal event with its original capture timestamp, not the upload timestamp.
3. If an item fails to upload after 3 retries (network error, DO unavailable), it stays in queue and retries on next connectivity event. It is never silently dropped.
4. The user does not need to do anything — the upload is silent. A small indicator shows "syncing" while the queue drains.

The offline queue is local to the device only. It is not persisted to iCloud, Google Drive, or any cloud backup. If the user uninstalls the app before connectivity returns, unsynced items are lost. This is acceptable — the app is not a primary record system for health-critical data, and the data would not have had a chance to be acted on anyway.

### 7. Architectural Validation

The one DO per user decision is the right one. This is worth stating explicitly because it is the foundation every other decision builds on.

**You get for free**:
- **Location affinity**: the DO provisions geographically close to where the user first requests it. A user in Lagos gets an agent running near Lagos. A user in Seoul gets one near Seoul. No configuration — Cloudflare handles it.
- **Zero-cost hibernation**: idle DOs cost nothing. A user who scans once a week and does nothing else incurs effectively zero compute cost between scans.
- **Per-user memory isolation**: one user's brain is physically incapable of touching another user's SQLite. Not access-controlled — literally different SQLite files.
- **Consistent addressing**: `idFromName(userId)` always returns the same DO instance. No session management, no routing table, no distributed lock.

The only architectural risk is data gravity — if a user's DO accumulates a very large SQLite (realistically >1GB), and the Cloudflare edge node that owns it goes away, there is a migration delay. This is an edge case the platform handles, but worth monitoring per-user storage size in production and alerting if any single DO exceeds 500MB.
