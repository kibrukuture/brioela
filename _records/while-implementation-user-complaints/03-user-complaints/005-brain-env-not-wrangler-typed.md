# 005 — `BrioelaBrainEnv` Is Not Typed Against Wrangler Bindings

## Complaint

`brioela.brain.agent.ts` defines the environment type for the Brain DO as:

```typescript
// brioela.brain.agent.ts:22 (approximate)
type BrioelaBrainEnv = Cloudflare.Env
```

`Cloudflare.Env` is the generic catch-all interface from `@cloudflare/workers-types`. It types every binding as `unknown` unless you override it. This means:

1. Accessing `this.env.MIRA_SESSION` in the DO body gives type `unknown` — no autocomplete, no compile error if the binding name is misspelled.
2. When a new Durable Object binding (e.g. `MIRA_SESSION`, `BRAIN_KV`, `QUEUE_OUTBOUND`) is added to `wrangler.jsonc`, there is zero compile-time enforcement that the code uses the correct binding name or the correct type.
3. The env type provides no documentation of what infrastructure the Brain DO actually depends on. A new engineer reading `brioela.brain.agent.ts` has to grep `wrangler.jsonc` separately to understand the runtime shape.

## What Needs to Happen

Replace `Cloudflare.Env` with an explicit interface that mirrors the current `wrangler.jsonc` bindings:

```typescript
interface BrioelaBrainEnv {
  DB: D1Database
  // Add as bindings are declared in wrangler.jsonc:
  // MIRA_SESSION: DurableObjectNamespace
  // BRAIN_KV: KVNamespace
  // QUEUE_OUTBOUND: Queue<...>
}
```

This should be co-located in `brioela.brain.agent.ts` (or a sibling `brioela.brain.env.ts` if it grows). Keep it in sync with `wrangler.jsonc` manually — or better, generate it from `wrangler types` (the official Cloudflare tooling for this).

**Note on `wrangler types`**: Cloudflare Workers provides `wrangler types` which reads `wrangler.jsonc` and emits a `worker-configuration.d.ts` file with a typed `Env` interface. If the project adopts this, `BrioelaBrainEnv` becomes:

```typescript
import type { Env } from '../../../worker-configuration'  // generated
type BrioelaBrainEnv = Env
```

That approach means zero manual sync — the generated file is always in lock-step with `wrangler.jsonc`. Either approach is acceptable; the key constraint is that `Cloudflare.Env` (the untyped interface) must go.

## Why

Mistyped binding names (`env.MIRA_SESION` instead of `env.MIRA_SESSION`) are currently a runtime error in production, not a TypeScript error at compile time. For infrastructure bindings — databases, Durable Objects, queues — a wrong string means the binding is `undefined` at runtime and the handler crashes. This class of error is completely preventable with a typed `Env` interface.

The Angular/Ember design principle: the entry point of a module declares its full dependency surface explicitly. `Cloudflare.Env` is the equivalent of `any` for infrastructure — it documents nothing and enforces nothing.

## Affected Files

- `backend/src/agents/brain/brioela.brain.agent.ts` (line ~22 — `BrioelaBrainEnv = Cloudflare.Env`)
- `wrangler.jsonc` (read-only source of truth for what bindings actually exist)
- Potentially: add `wrangler types` to the build/CI pipeline to keep `worker-configuration.d.ts` in sync

## Status

**OPEN.** Low urgency until new bindings are added. High urgency the moment `MIRA_SESSION` or any new DO binding is wired up — fix before that point.
