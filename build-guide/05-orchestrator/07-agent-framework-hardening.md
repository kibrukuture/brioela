# Orchestrator — Agent Framework Hardening

## What This File Covers

How to harden Brioela's ambient agent architecture using current Cloudflare Agents SDK primitives
without turning Brioela into a chat app and without replacing Vercel AI SDK for model/tool calling.

This file is based on Brioela's MD specs and current Cloudflare Agents documentation. It updates
older manual patterns in this folder where Cloudflare now provides stronger primitives.

---

## Ground Rule — Brioela Is Ambient, Not Chat-First

The Orchestrator is not a chat assistant. It is the per-user ambient food operating system.

Evidence from product docs:

- `brioela-specs/00-product-philosophy-and-ux.md` says Brioela is an ambient operating system for everything the user eats.
- The same spec says silence is the default and speech is the exception.
- `brioela-specs/17-behavioral-food-pattern-detection.md` says data collection is passive and no explicit tracking is allowed.
- `implementable-specs/01-memory-event.md` says `memory_event` is the raw append-only event foundation.

So framework choices must serve:

```text
ambient events
per-user memory
passive inference
sparse surfacing
safety-first tools
long-lived background work
voice/camera sessions
```

not a generic chat UX.

---

## Final Layer Split

Use each framework only where it is strongest.

| Layer | Owner | Why |
|---|---|---|
| Durable agent runtime | Cloudflare Agents SDK | per-user DO instances, SQLite, WebSockets, schedules, queues, sub-agents, fibers |
| Model/tool calling | Vercel AI SDK | `tool()`, Zod schemas, strict tool calling, structured output, loop control, provider abstraction |
| HTTP product API | ts-rest | contract-first HTTP, request/response validation, mobile hooks |
| Durable multi-step jobs | Cloudflare Workflows via Agents SDK | retries, waiting, approvals, progress callbacks |
| Food memory and safety | Brioela custom | product-specific truth, constraints, silence rules, privacy |

Do not replace AI SDK with Cloudflare Agents SDK. They are different layers.

Do not replace Brioela's ambient product design with a generic agent platform.

---

## Cloudflare Documentation Basis

Cloudflare docs used for these decisions:

- Agents API: `https://developers.cloudflare.com/agents/runtime/agents-api/`
- Sub-agents: `https://developers.cloudflare.com/agents/runtime/execution/sub-agents/`
- Agent tools: `https://developers.cloudflare.com/agents/runtime/execution/agent-tools/`
- Schedule tasks: `https://developers.cloudflare.com/agents/runtime/execution/schedule-tasks/`
- Queue tasks: `https://developers.cloudflare.com/agents/runtime/execution/queue-tasks/`
- Durable execution with fibers: `https://developers.cloudflare.com/agents/runtime/execution/durable-execution/`
- Run Workflows: `https://developers.cloudflare.com/agents/runtime/execution/run-workflows/`
- Sessions: `https://developers.cloudflare.com/agents/runtime/lifecycle/sessions/` *(experimental; use carefully)*
- Agent Skills: `https://developers.cloudflare.com/agents/runtime/execution/agent-skills/` *(experimental; use carefully)*

Vercel AI SDK docs used for tool/model layer:

- Tool calling: `https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling`
- Agents overview: `https://ai-sdk.dev/docs/agents/overview`
- Building agents: `https://ai-sdk.dev/docs/agents/building-agents`
- Workflow patterns: `https://ai-sdk.dev/docs/agents/workflows`

---

## What Stays From The Current Brioela Design

These are product architecture decisions, not replaceable plumbing:

- One permanent `BrioelOrchestrator` per user.
- Private per-user SQLite memory.
- `memory_event` is append-only truth.
- `user_memory` is derived facts, not history.
- User-visible safety and constraints remain Brioela-owned.
- Tools are the only LLM-to-SQLite write interface.
- Device events can enter through system endpoints and become memory events.
- Brioela surfaces only justified ambient moments.
- CookingAgent remains session-scoped, not user-scoped.
- Gemini Live / Cloudflare Realtime media bridge remains custom.

Do not change these because a framework offers a generic pattern.

---

## What Changes — Replace Manual Plumbing

### 1. Replace Custom KeepAlive Alarms

Older docs describe a manual 20-second keepAlive alarm loop:

```text
keepAlive flag -> setAlarm every 20s -> alarm handler exits early
```

Use current Agents SDK:

```typescript
await this.keepAliveWhile(async () => {
  await runLongStreamingOrModelWork()
})
```

Use `runFiber()` when work must survive eviction:

```typescript
await this.runFiber("pattern-detection", async (ctx) => {
  const events = await loadEvents()
  ctx.stash({ loadedEventCount: events.length })

  const patterns = await detectPatterns(events)
  ctx.stash({ patterns })

  await writePatternResults(patterns)
})
```

Why better:

- no custom heartbeat table
- built-in keepAlive cleanup
- eviction recovery with snapshots
- less chance of orphaned keepAlive loops

---

### 2. Replace `scheduled_alarms` As The Execution Engine

Older docs make `scheduled_alarms` the execution queue. Current Agents SDK has SQLite-backed scheduling:

```typescript
await this.schedule(new Date(fireAt), "runSicknessFollowup", {
  eventId,
})

await this.schedule("0 8 * * 0", "runWeeklyFoodSummary", {
  timezone,
})
```

Use `this.schedule()` / `this.scheduleEvery()` as the execution engine.

`scheduled_alarms` may still exist as a Brioela domain/audit table if product needs it, but it should not be the primary scheduler unless SDK scheduling cannot express the use case.

Why better:

- built-in persistence
- delayed/date/cron/interval support
- idempotency options
- list/cancel APIs
- retry options
- sub-agent schedule routing
- no custom alarm dispatcher required for normal cases

---

### 3. Replace Manual FIFO Background Work With `queue()`

Older docs imply custom background queues via tables and alarms. Use Agents SDK queue for ordered async work that should run soon:

```typescript
await this.queue("processReceiptIngestion", {
  receiptEventId,
}, {
  retry: {
    maxAttempts: 5,
    baseDelayMs: 500,
    maxDelayMs: 10_000,
  },
})
```

Use queue when:

- order matters
- work should run ASAP
- work is background but belongs to this user/agent

Use schedule when:

- work must run at a specific future time
- recurring timing matters

Use Workflow when:

- multi-step durable work spans external calls, retries, waits, or approvals

---

### 4. Replace Custom Sub-Agent HTTP Forwarding

Older docs describe:

```text
CuratorAgent -> POST /internal/tool-call -> Orchestrator executes tool
```

Use current Agents SDK sub-agents for typed parent-child agent calls where possible:

```typescript
const curator = await this.subAgent(CuratorAgent, `curator-${runId}`)
await curator.runCuratorPass({ userId: this.userId })
```

Cloudflare sub-agents provide:

- child agent identity
- isolated child SQLite
- typed RPC stubs
- parent-child routing
- `parentAgent()` from child to parent
- schedule/fiber support inside sub-agents
- storage isolation by child

The Brioela rule still stands:

```text
Only the Orchestrator writes user-memory truth.
```

But transport should be typed parent-child RPC, not custom internal HTTP, unless a specific boundary requires HTTP.

---

### 5. Use `agentTool()` / `runAgentTool()` For Retained Child Runs

For child agents that are invoked as model tools, use Agents SDK agent tools:

```typescript
research: agentTool(ResearchAgent, {
  description: "Research one food-source question with citations.",
  inputSchema: z.object({ query: z.string().min(3) }),
})
```

or imperative:

```typescript
await this.runAgentTool(PatternDetectionAgent, {
  input: { windowDays: 14 },
  runId: `pattern-${userId}-${week}`,
})
```

Cloudflare agent tools provide:

- retained child runs
- event replay
- cancellation
- streaming child timelines
- structured `AgentToolFailure`
- parent re-attach after restart
- drill-in routing for inspection

This is hard to rebuild correctly. Prefer SDK agent tools over custom retained-run tables.

---

### 6. Use Workflows For Multi-Step Durable Jobs

Use Cloudflare Workflows when a task is more than simple schedule/queue/fiber work:

- deep product enrichment with multiple external calls
- travel preload with retries and staged outputs
- recall pipeline with feed fetch → match → notify
- human approval or long wait
- multi-step workflow where steps need retry and idempotency

Pattern:

```typescript
const instanceId = await this.runWorkflow("PRODUCT_ENRICHMENT_WORKFLOW", {
  productId,
  scanEventId,
})
```

Workflow can call back into the originating Agent with typed RPC and report progress.

---

## Use AI SDK For Tool Calling

Cloudflare Agents SDK does not replace Vercel AI SDK tool calling.

Use Vercel AI SDK for:

- `tool()` definitions
- Zod `inputSchema`
- strict tool calling where supported
- `ToolLoopAgent` when a reusable model/tool loop is appropriate
- `streamText` / `generateText`
- `stopWhen`
- `prepareStep`
- `onStepFinish`
- tool approval
- structured output
- provider/model switching

Brioela tools should remain explicit and typed:

```typescript
export const writeUserMemoryTool = tool({
  description: "Write or merge a structured fact into user_memory.",
  inputSchema: WriteUserMemorySchema,
  strict: true,
  execute: async (input) => {
    return await writeUserMemory(input)
  },
})
```

Tool calling is AI SDK territory. Durable execution is Cloudflare territory.

---

## Be Careful With Experimental Cloudflare APIs

Some Cloudflare APIs are promising but should not be adopted blindly.

### Sessions API

Useful ideas:

- persistent tree-structured messages
- context blocks
- compaction
- FTS search
- skill/search context tools
- cached prompts

Risk:

- docs mark it experimental
- Brioela already has custom `sessions`, `session_turns`, `memory_event`, and prefix cache rules

Recommendation:

```text
Do not replace Brioela session schema yet.
Study Sessions API for patterns.
Pilot only if it cleanly preserves Brioela's ambient/session semantics.
```

### Agent Skills

Useful ideas:

- on-demand instruction loading
- skill catalog in prompt
- `activate_skill` / `read_skill_resource`
- R2-backed skills

Risk:

- experimental
- Brioela skills are user-evolving memory, not just bundled instruction packs

Recommendation:

```text
Keep Brioela `skills` table for user-created skills.
Consider Agents SDK skills only for static system skills or bundled references.
```

### Think

Useful ideas:

- higher-level harness
- built-in hooks/tools/recovery

Risk:

- chat-shaped
- may push product toward chat UX
- Brioela is ambient and voice/camera-first

Recommendation:

```text
Do not adopt Think as the core Orchestrator harness now.
Borrow specific lifecycle/recovery patterns only.
```

---

## Concrete Brioela Examples

### Pattern Detection

Current intent:

```text
Every 14 days, inspect memory_event and derive patterns.
```

Hardened architecture:

```typescript
await this.schedule("0 3 */14 * *", "runPatternDetection", {
  windowDays: 14,
})

async runPatternDetection(payload: { windowDays: number }) {
  await this.runFiber("pattern-detection", async (ctx) => {
    const events = await loadMemoryEvents(payload.windowDays)
    ctx.stash({ eventCount: events.length })

    const patterns = await detectPatternsWithAiSdk(events)
    ctx.stash({ patternCount: patterns.length })

    await writeConfirmedPatterns(patterns)
  })
}
```

No custom `scheduled_alarms` dispatch needed for this path.

---

### Curator

Current intent:

```text
Weekly maintenance of skills, personality, memory contradictions.
```

Hardened architecture:

```typescript
await this.schedule("0 4 * * 0", "runCurator", {})

async runCurator() {
  const curator = await this.subAgent(CuratorAgent, `curator-${Date.now()}`)
  await curator.run({ parentUserId: this.userId })
}
```

Curator can use typed parent RPC for reads/proposed writes. Orchestrator remains authoritative.

---

### Scan Follow-Up

Current product behavior:

```text
User scans product repeatedly and never buys it. Brioela may surface pattern later.
```

Hardened architecture:

```typescript
await this.schedule(7 * 24 * 60 * 60, "runScanFollowup", {
  scanEventId,
  productId,
})
```

When it fires:

```typescript
async runScanFollowup(payload: ScanFollowupPayload) {
  const shouldSurface = await evaluateAmbientMoment(payload)
  if (!shouldSurface) return

  await createAmbientSurface(payload)
}
```

The surfacing logic still obeys Brioela's silence rules.

---

### Cooking Session Recovery

Current intent:

```text
CookingAgent survives disconnects and DO eviction.
```

Hardened architecture:

Use `keepAliveWhile()` around long provider interactions and `runFiber()` around recoverable work:

```typescript
await this.keepAliveWhile(async () => {
  await runGeminiLiveBridge()
})
```

For multi-step session-end processing:

```typescript
await this.runFiber("cooking-session-end", async (ctx) => {
  const transcript = await collectTranscript()
  ctx.stash({ transcriptCollected: true })

  const summary = await summarizeCookingSession(transcript)
  ctx.stash({ summary })

  await writeRecipeAndMemory(summary)
})
```

The Gemini Live media bridge remains custom because it is Brioela-specific and model/API-specific.

---

## New Rules

- Do not build a custom runtime feature when Agents SDK already provides it.
- Do not use custom internal HTTP between parent/child agents unless crossing a true product/API boundary.
- Orchestrator remains the only writer of user memory truth.
- AI SDK remains the tool/model layer.
- Cloudflare Agents SDK owns durable runtime execution.
- Workflows own long, multi-step durable flows.
- Brioela owns food memory, safety, privacy, and ambient surfacing policy.

---

## What To Update In Older Files Later

These files contain older manual patterns and should be reconciled before coding:

- `01-do-class-and-setup.md` — replace custom keepAlive alarm with `keepAliveWhile()` / fibers where appropriate.
- `02-tool-protocol.md` — keep AI SDK tools, but add shared tool contracts and safer permission metadata.
- `03-session-lifecycle.md` — compare custom compression with Cloudflare Session API patterns, but do not adopt experimental API blindly.
- `04-sub-agents.md` — replace `/internal/tool-call` HTTP forwarding with `subAgent()`, `parentAgent()`, `agentTool()`, or `runAgentTool()` where possible.
- `05-alarm-system.md` — make SDK schedule/queue the execution engine; keep custom tables only for domain audit if needed.
- `08-cooking-session/*` — use `keepAliveWhile()`/`runFiber()` for recovery, keep Gemini Live media bridge custom.

---

## One-Line Law

Use Cloudflare Agents SDK for durable ambient runtime, AI SDK for model/tool intelligence, and Brioela custom code only for product truth.
