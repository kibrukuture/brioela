# Process lesson: schema column name mismatch

**Source**: `_records/while-implementation-user-complaints/02-user-complaints/003-scheduled-alarms-scheduled-for-mismatch.md`

**What happened**: Specs referenced `scheduled_for`; Drizzle schema used `scheduledAt` / `scheduled_at`.

**User impact**: Tool executables and queries would fail at compile or runtime.

**Pattern fix**: Read `backend/src/agents/brain/_schemas/*.schema.ts` before writing tool specs or executables. Align spec vocabulary to Drizzle property names.

**Status**: FIXED — specs aligned to `scheduledAt`.

**Future enforcement**: Reading gate Layer A attestation (column list diff) — G-enf-2.
