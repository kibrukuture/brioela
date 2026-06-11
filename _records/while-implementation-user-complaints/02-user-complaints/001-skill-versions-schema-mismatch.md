# 001 — `skill_versions` Schema Columns Mismatch

## Complaint
The specification `implementable-specs/05-skill-versions.md` and the open ledger entry `0002.skill-tools.md` expect the `skill_versions` table to contain:
- `description: text`
- `updatedBy: text`
- `updateReason: text` (or `update_reason`)

However, the actual database schema in `backend/src/agents/brain/_schemas/skill.version.schema.ts` does not contain the `description` or `updatedBy` columns at all. Furthermore, the `updateReason` column is implemented under the name `reason`.

## What Needs to Happen
We must decide whether to:
1. Update the Drizzle schema in `skill.version.schema.ts` and generate a migration to add `description`, `updated_by` (with its check constraint), and rename `reason` to `update_reason`.
2. Or update the specs, ledger entries, and tool executables to omit `description` and `updatedBy`, and query the `reason` column instead of `updateReason`.

## Why
Writing values to columns that do not exist in the Drizzle schema results in TypeScript compiler errors and database insert failures. The spec and schema must align perfectly.

## Status
**FIXED.** Modified the Drizzle schema in `skill.version.schema.ts` to add `description` and `updatedBy` columns (with its check constraint), and renamed `reason` to `updateReason` (mapped to `update_reason`). Generated SQLite migrations `0002_sad_dragon_man.sql` and `0003_next_rafael_vega.sql` to recreate/migrate the table safely, and updated the migrations manifest.
