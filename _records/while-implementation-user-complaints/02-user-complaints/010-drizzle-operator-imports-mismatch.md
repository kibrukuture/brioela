# 010 — Drizzle operator imports mismatch

## Complaint
The open ledger entries propose importing operators like `and`, `eq`, `inArray`, and `sql` from `@brioela/shared/drizzle`.

However, the codebase standard is to import these database-specific query helpers from:
- `@/database/drizzle/_database` (for `and`, `eq`, `getReturned`, `inArray` etc.)
- `@/database/sqlite/_schema` (for `sql`, `sqliteTable`, `text` etc.)

## What Needs to Happen
All database queries and schemas must import query operators and schemas from their correct internal paths instead of `@brioela/shared/drizzle` or other external paths.

## Why
Importing from incorrect paths results in unresolved module exports, failing type checks, and compilation crashes.

## Status
**FIXED.** Brain `_repositories/` and `_schemas/` import operators from `@/database/drizzle/_database` and schema builders from `@/database/sqlite/_schema`. No `@brioela/shared/drizzle` imports under `backend/src/agents/brain/`.
