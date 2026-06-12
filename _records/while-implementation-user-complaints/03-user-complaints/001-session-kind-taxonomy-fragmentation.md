# 001 — Session Kind Taxonomy Fragmentation

## Complaint

Two separate definitions of "session kind" exist in the codebase with **different members**. They are not linked and will silently drift further as features are added.

**Definition A — `session.schema.ts:3` (Drizzle DB schema)**
```typescript
const sessionKind = ['chat', 'cooking', 'alarm', 'background'] as const
```

**Definition B — `get.brain.tools.ts:13` (tool permission map)**
```typescript
export const sessionKindSchema = z.enum(['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'])
export type SessionKind = z.infer<typeof sessionKindSchema>
```

**Diff:**
- `background` — exists in DB, absent from tool permissions
- `brain_maintenance` — exists in tool permissions, absent from DB
- `behavior_pattern_detection` — exists in tool permissions, absent from DB

This means any session row created with `session_type: 'brain_maintenance'` will fail the DB CHECK constraint. Any feature that creates a `background` session and then tries to call `getBrainTools(db, userId, 'background', ...)` will get a TypeScript error — `'background'` is not assignable to `SessionKind`.

## What Needs to Happen

1. Create `backend/src/agents/brain/_constants/session.kind.constant.ts` as the single source of truth:
   ```typescript
   export const SESSION_KIND_VALUES = ['chat', 'cooking', 'alarm', 'background', 'brain_maintenance', 'behavior_pattern_detection'] as const
   export const sessionKindSchema = z.enum(SESSION_KIND_VALUES)
   export type SessionKind = z.infer<typeof sessionKindSchema>
   ```

2. Update `session.schema.ts` — replace the local `sessionKind` array with an import of `SESSION_KIND_VALUES`:
   ```typescript
   import { SESSION_KIND_VALUES } from '@/agents/brain/_constants/session.kind.constant'
   sessionType: text('session_type', { enum: SESSION_KIND_VALUES }).notNull()
   ```
   Also update the DB CHECK constraint string to include all values.
   Generate a migration if the DB CHECK constraint changes.

3. Remove the `sessionKindSchema` and `SessionKind` declarations from `get.brain.tools.ts`. Import from `_constants/` instead.

4. Verify `TOOL_PERMISSIONS` in `get.brain.tools.ts` has an entry for every member of `SESSION_KIND_VALUES`. Add `background` with its allowed tools (or `[]` if background sessions have no tools).

## Why

The DB CHECK constraint is the last enforcement boundary. If `session_type` values don't match the Zod enum used by the Brain DO, any session created by tool code fails silently at insert time rather than being caught at TypeScript compile time. This is the kind of bug that only surfaces in production under specific session flows.

A single constant file eliminates the drift surface entirely — one change to add a session kind propagates to both DB schema and tool permissions automatically.

## Affected Files

- `backend/src/agents/brain/_schemas/session.schema.ts:3`
- `backend/src/agents/brain/_tools/get.brain.tools.ts:13`

## Status

**OPEN.**
