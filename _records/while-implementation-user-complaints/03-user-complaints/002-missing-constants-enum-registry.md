# 002 — Missing `_constants/` Enum Registry at Agent Level

## Complaint

The Brain agent has no canonical home for enum taxonomy. Known-value sets (session kinds, alarm types, memory event kinds, constraint categories, recipe origins) are either:
- Defined as raw `as const` arrays inside schema files (`session.schema.ts:3`)
- Defined as `z.enum()` inside tool schema files (`write.user.memory.schema.ts`)
- Left as free `z.string()` with no enum enforcement pending future values (`alarm_type`, `memory event kind`)

When a new feature adds a new `alarm_type` (e.g. `sickness_followup`), there is currently no single file to update. The value must be manually tracked across: the Zod tool schema, any DB CHECK constraint, any switch statement in executables, any prompt that lists valid values.

Angular enforces this via module-level constants. Ember via model enums. The principle: each bounded context owns its taxonomy in one file.

## What Needs to Happen

Create `backend/src/agents/brain/_constants/` with one file per enum domain:

```
_constants/
  session.kind.constant.ts       ← SESSION_KIND_VALUES, sessionKindSchema, SessionKind
  alarm.type.constant.ts         ← ALARM_TYPE_VALUES, alarmTypeSchema, AlarmType (populated as features ship)
  memory.event.kind.constant.ts  ← MEMORY_EVENT_KIND_VALUES (or leave as free-text if spec says so — see below)
  recipe.origin.constant.ts      ← RECIPE_ORIGIN_VALUES (already has recipe.origin.schema.ts — move constant here)
  constraint.category.constant.ts ← constraint categories if enumerated
  index.ts                        ← barrel export
```

Each schema file that currently defines an enum inline should import from the corresponding `_constants/` file. The Drizzle schema files use the `as const` array from `_constants/` for their `{ enum: ... }` column type. The Zod schemas use the `z.enum()` also exported from `_constants/`. DB CHECK constraints and TypeScript types are all derived from the same source.

**Note on memory event kind:** `implementable-specs/01-memory-event.md` explicitly decided this is intentionally free text — AI writes any kind it judges correct. Do NOT add `memory.event.kind.constant.ts`. Document this decision in the barrel `index.ts` as a comment so future engineers don't add it.

## Example

```typescript
// _constants/alarm.type.constant.ts
import { z } from '@brioela/shared/zod'

export const ALARM_TYPE_VALUES = [
  'brain_maintenance_run',
  'behavior_pattern_detection',
  'sickness_followup',
  'travel_preload',
] as const

export const alarmTypeSchema = z.enum(ALARM_TYPE_VALUES)
export type AlarmType = z.infer<typeof alarmTypeSchema>
```

```typescript
// _tools/_schemas/schedule.user.alarm.schema.ts (after fix)
import { alarmTypeSchema } from '@/agents/brain/_constants/alarm.type.constant'

export const scheduleUserAlarmSchema = z.object({
  alarm_type: alarmTypeSchema.describe('Alarm type — e.g. sickness_followup, travel_preload.'),
  // ...
})
```

## Why

Right now adding a new alarm type requires touching: the tool schema, any hardcoded string in executables, any switch statement. With `_constants/`, TypeScript makes the `alarm_type` exhaustiveness check at the switch sites, and a missing value is a compiler error, not a runtime `undefined`.

This is the Angular/Ember design principle: each module owns its domain vocabulary in one explicit file. The rest of the system imports, never re-declares.

## Affected Files

- `backend/src/agents/brain/_schemas/session.schema.ts` (moves `sessionKind` array out)
- `backend/src/agents/brain/_tools/get.brain.tools.ts` (imports from `_constants/`)
- `backend/src/agents/brain/_tools/_schemas/schedule.user.alarm.schema.ts` (imports `alarmTypeSchema`)
- `backend/src/agents/brain/_schemas/recipe.origin.schema.ts` (can stay or move — TBD)

## Status

**OPEN.** Fix 001 (session kind) first as the highest-urgency instance of this pattern. Then create `_constants/` and migrate the others.
