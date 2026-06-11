# 008 — Returning query operator mismatch

## Complaint
The open ledger entries propose Drizzle query operations using the format `.returning().get()` directly on query chains (e.g. `db.insert(skills).values(...).returning().get()`).

However, the codebase repository pattern does not support calling `.get()` directly on a `.returning()` query block in Drizzle. Instead, it expects the query to use the **`getReturned(...)`** helper function imported from `@/database/drizzle/_database`:
```typescript
import { getReturned } from '@/database/drizzle/_database'

return getReturned(
  db.insert(skills).values(...).returning()
)
```

## What Needs to Happen
All repository helper methods returning inserted or updated rows must be written using the `getReturned(...)` pattern instead of `.returning().get()`.

## Why
Calling `.returning().get()` is not a standard method in Drizzle ORM and will throw compilation errors. We must maintain codebase consistency and type safety.

## Status
**OPEN.**
