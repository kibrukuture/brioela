# 003 — `_types/` Folder Contains Only Thin Passthrough Wrappers

## Complaint

The `_types/` folder under the Brain agent contains four files. Three of them are trivial type aliases that re-export an inferred type from `_schemas/` with a different name and no added semantics:

```typescript
// _types/brain.memory.command.type.ts — entire file:
import type { NewBrainMemoryEvent } from '@/agents/brain/_schemas'
export type BrainMemoryEventWrite = NewBrainMemoryEvent

// _types/brain.memory.event.type.ts — entire file (presumed):
// Similar pattern — re-exports a schema-inferred type
```

A `_types/` folder implies richer domain types that go beyond what schemas can express — discriminated unions, branded IDs, multi-schema compositions, lifecycle state machines. When it only contains `type X = Y` one-liners, it creates the impression of a richer abstraction than actually exists. Engineers waste time looking for the "real" type definition before discovering it's just a schema infer.

The error types (`brain.migration.error.type.ts`, `brain.readiness.error.type.ts`) DO belong here — they are error class types that don't come from schemas. Those should stay.

## What Needs to Happen

**Option A (recommended):** Audit each file in `_types/`:
- If it's `type X = SomeSchemaType` with no added semantics → delete it. Update all imports to point directly to `_schemas/`.
- If it's an error class, discriminated union, or branded type → keep it.

Likely outcome: `brain.memory.command.type.ts` and `brain.memory.event.type.ts` get deleted. `brain.migration.error.type.ts` and `brain.readiness.error.type.ts` stay.

**Option B:** Make `_types/` earn its place. If `BrainMemoryEventWrite` should have a different shape from `NewBrainMemoryEvent` (e.g. omitting auto-generated fields, adding validation), make the type do real work rather than being an alias.

**Do not do:** Keep the files as aliases to "preserve the abstraction layer." Indirection without value is technical debt, not architecture.

## Why

Thin wrappers are a code smell precisely because they look meaningful but aren't. A reader following an import trail through `BrainMemoryEventWrite → NewBrainMemoryEvent → typeof memoryEvent.$inferInsert` has wasted two hops for zero information gain. The Angular principle this violates: if a module exports something, that thing should do real work.

## Affected Files

- `backend/src/agents/brain/_types/brain.memory.command.type.ts`
- `backend/src/agents/brain/_types/brain.memory.event.type.ts`
- Any files that import from these (update imports to go directly to `_schemas/`)

## Status

**OPEN.** Low urgency. Tackle after 001 and 002. Requires reading all four `_types/` files to confirm which are aliases before deleting.
