# Implementation Ledger Index

## Purpose

This ledger records what has actually been implemented or materially changed in the repo. Build guides and specs describe what should exist; this ledger records what now exists, what remains unfinished, and what the next implementation slice should be.

## Rules

- Every real coding slice adds or updates one ledger entry.
- Entries are append-only unless correcting factual mistakes.
- Each entry links to the source guide/spec it satisfies.
- Each entry records verification commands.
- Deferred work must be explicit.

## Folder Shape

```text
_records/implementation-ledger/{domain}/{scope}/NNNN.short.name.md
```

Examples:

```text
_records/implementation-ledger/brain/sqlite-migration-runtime/0001.design.docs.md
_records/implementation-ledger/brain/sqlite-migration-runtime/0002.runtime.foundation.md
_records/implementation-ledger/contracts/ts-rest-spine/0001.guard.rules.md
```

## Entries

| Entry | Scope | Status | Summary |
|---|---|---|---|
| `brain/sqlite-migration-runtime/0001.design.docs.md` | Brain / SQLite migration runtime | done | Added the production migration doctrine to build guides/specs. |
| `brain/drizzle-spine/0001.initial-spine.md` | Brain / Drizzle spine | done | Added the first Brain Agent, Drizzle schema, repository boundary, migration bundle, smoke path, and Durable Object binding. |
| `brain/drizzle-spine/0002.memory-event-cursor.md` | Brain / Drizzle spine | done | Reworked Brain memory listing to keyset cursor pagination with a Drizzle-owned composite index migration. |
