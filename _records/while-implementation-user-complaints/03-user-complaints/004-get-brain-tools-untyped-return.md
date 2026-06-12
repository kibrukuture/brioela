# 004 — `getBrainTools` Has No Explicit Return Type

## Complaint

`get.brain.tools.ts` builds the tool set for a session and returns it via `Object.fromEntries()`:

```typescript
export function getBrainTools(
  db: BrainDatabase,
  userId: string,
  kind: SessionKind,
  activeSessionId: string | null = null,
  waitUntil?: (promise: Promise<void>) => void,
  wake?: AlarmWakeCallbacks,
) {
  // ...
  return Object.fromEntries(
    Object.entries(all).filter(([name, tool]) => allowed.has(name) && tool !== undefined),
  )
}
```

`Object.fromEntries()` erases all type information. The inferred return type is `{ [k: string]: ... }`. This means:

1. A caller that tries to use a specific tool from the returned object has no type safety.
2. TypeScript cannot verify that `TOOL_PERMISSIONS['alarm']` actually corresponds to tools that exist in `all`.
3. If a tool name in `TOOL_PERMISSIONS` is misspelled (e.g. `'log_memorey_event'`), it silently returns no tools for that permission — no error.

## What Needs to Happen

Add an explicit return type. The simplest correct approach uses `Pick` against a known all-tools type:

```typescript
type AllBrainTools = {
  log_memory_event: ReturnType<typeof logMemoryEventTool>
  write_user_memory: ReturnType<typeof writeUserMemoryTool>
  read_user_memory: ReturnType<typeof readUserMemoryTool>
  view_user_recipe: ReturnType<typeof viewUserRecipeTool>
  update_user_recipe: ReturnType<typeof updateUserRecipeTool>
  archive_user_recipe: ReturnType<typeof archiveUserRecipeTool>
  schedule_user_alarm: ReturnType<typeof scheduleUserAlarmTool>
  cancel_user_alarm: ReturnType<typeof cancelUserAlarmTool>
}

type BrainToolName = keyof AllBrainTools

export type BrainTools = Partial<AllBrainTools>
```

Then make `TOOL_PERMISSIONS` typed against `BrainToolName[]`:

```typescript
const TOOL_PERMISSIONS: Record<SessionKind, BrainToolName[]> = { ... }
```

This turns a misspelled tool name in `TOOL_PERMISSIONS` into a TypeScript error at the definition site, not a silent runtime omission.

The function return type becomes `BrainTools` (a `Partial<AllBrainTools>`), and callers get proper intellisense on which tools might be present.

## Why

`TOOL_PERMISSIONS` is a security-critical table — it determines what an AI session can DO. If the string `'schedule_user_alarm'` in the permissions table drifts from the actual key in `all`, that tool gets silently excluded from sessions that need it (or silently included if the filter logic is inverted). TypeScript checking the permission strings against the actual tool map eliminates this class of bug entirely.

## Affected Files

- `backend/src/agents/brain/_tools/get.brain.tools.ts`

## Status

**OPEN.** Medium urgency — fix before implementing new session kinds or adding new tools, so the type safety is in place from the start.
