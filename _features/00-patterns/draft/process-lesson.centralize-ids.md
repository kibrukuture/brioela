# Process lesson: centralize ID generation

**Source**: `_records/while-implementation-user-complaints/01-user-complaints/001-nanoid-centralize.md`

**What happened**: `nanoid(24)` scattered across call sites — hidden coupling on ID length.

**Pattern fix**: `createId()` in `shared/_ids/create.id.helper.ts`; import `@brioela/shared/_ids`.

**Status**: FIXED in brain code paths cited in complaint.

**Draft production snapshot**: `draft/shared.create.id.helper.production.md`
