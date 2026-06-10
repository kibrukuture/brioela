# 001 — Centralize `nanoid(24)` in `shared/_ids`

## Complaint
`id: nanoid(24)` is hardcoded all over the codebase. The literal `24` repeated everywhere is a hidden coupling — if the ID length ever changes, it has to be hunted down in every file. There is no single source of truth for what a Brioela ID is.

## What Needs to Happen
- Create `shared/_ids/index.ts` that exports a named wrapper, e.g. `newId()`, which calls `nanoid(24)` internally.
- Every call site that does `nanoid(24)` directly must import `newId` from `@brioela/shared/_ids` instead.
- The literal `24` disappears from all call sites; it lives in exactly one place.

## Why
Hardcoding `nanoid(24)` at every call site is the same anti-pattern as hardcoding a magic number. The ID length is a domain decision, not a per-file implementation detail.

## Status
**FIXED.** `createId()` exported from `shared/_ids/create.id.helper.ts` via `shared/_ids/index.ts`. All brain call sites (`log.memory.event.executable.ts`, `create.memory.event.write.mapper.ts`) import `createId` from `@brioela/shared/_ids`. No bare `nanoid(24)` remains in brain code.
