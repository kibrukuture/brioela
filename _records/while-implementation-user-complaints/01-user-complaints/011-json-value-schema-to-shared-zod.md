# 011 — `JsonValue` / `jsonValueSchema` Belongs in `shared/zod`, Not Brain's `_tools/_schemas`

## Complaint
```typescript
// currently at: backend/src/agents/brain/_tools/_schemas/json.value.schema.ts
import { z } from '@brioela/shared/zod'
const jsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
export type JsonValue = z.infer<typeof jsonLiteralSchema> | JsonValue[] | { [key: string]: JsonValue }
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => ...)
```
This is a generic Zod utility type — it is not brain-specific. Any part of the codebase that deals with JSON values needs this. Putting it inside the brain agent's tools folder makes it unavailable to the rest of the repo without importing across module boundaries.

## What Needs to Happen
- Move `json.value.schema.ts` to `shared/zod/` alongside the Zod v4 re-export.
- Export `jsonValueSchema` and `JsonValue` from `@brioela/shared/zod` (or a dedicated `@brioela/shared/zod/json-value` if the barrel is already large).
- Update all current importers of `@/agents/brain/_tools/_schemas/json.value.schema` to import from `@brioela/shared/zod` instead.
- Delete the file from the brain tools folder.

## Current Importers to Update
- `backend/src/agents/brain/_tools/_executables/read.user.memory.executable.ts`
- `backend/src/agents/brain/_tools/_executables/write.user.memory.executable.ts`
- `backend/src/agents/brain/_tools/_schemas/write.user.memory.schema.ts`
- `backend/src/agents/brain/_tools/_schemas/log.memory.event.schema.ts`
- `backend/src/agents/brain/_tools/brain.memory.tool.test.ts` (indirectly via schemas)

## Why
Generic primitives (JSON value types, common Zod utilities) belong in shared infrastructure, not inside a domain agent's implementation folder.

## Status
**FIXED.** Created `shared/zod/json.value.schema.ts`, exported `jsonValueSchema` and `JsonValue` from `@brioela/shared/zod`. Updated all 5 importers (`write.user.memory.schema.ts`, `log.memory.event.schema.ts`, `write.user.memory.executable.ts`, `read.user.memory.executable.ts`, `_schemas/index.ts`). Deleted old file from brain tools. Type guard clean.
