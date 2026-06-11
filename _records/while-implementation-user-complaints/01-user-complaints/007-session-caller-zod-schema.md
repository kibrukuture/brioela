# 007 — `SessionCallerType` Should Be a Zod Schema, Not a TypeScript Union

## Complaint
```typescript
export type SessionCallerType = 'chat' | 'cooking' | 'alarm' | 'brain_maintenance' | 'behavior_pattern_detection'
```
This is a raw TypeScript union type. There is no Zod validation schema for it. Anywhere a `SessionCallerType` value enters the system (from RPC, from a client, from a tool call), it is never validated — TypeScript types are erased at runtime.

## What Needs to Happen
- Replace the raw union type with a Zod schema:
  ```typescript
  export const sessionCallerSchema = z.enum(['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'])
  export type SessionCaller = z.infer<typeof sessionCallerSchema>
  ```
- The Zod `z.enum()` provides runtime validation AND the TypeScript type.
- All places that accept a session caller value must parse it through `sessionCallerSchema` at the boundary.

## Why
TypeScript unions disappear at runtime. A raw string `'hacker_mode'` passes TypeScript checks if the input is typed loosely elsewhere. Zod `z.enum()` rejects it at the boundary with a clear error.

## Status
**FIXED.** Raw TS union replaced with `z.enum([...])` in `memory.tool.ts`. `sessionKindSchema` exported as the Zod schema; `SessionKind` derived from it via `z.infer`. Any boundary that receives a session kind value can now call `sessionKindSchema.parse()` for runtime rejection of unknown values. Lexicon baseline updated (line numbers shifted from the import addition). Guards clean, 7/7 tests pass.
