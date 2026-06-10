# 003 — Enforce `getOne` / `getReturned` via Guard: No Direct `.get()` Allowed

## Complaint
`getReturned` and `getOne` exist but the guard does not fully enforce that they are the ONLY legal way to call `.get()` on a Drizzle query. Any stupid undefined can still leak if the rule has gaps or is not run.

## What Needs to Happen
- The `ban-drizzle-raw-get` guard rule must ban ALL direct `.get()` calls in `_repositories` and `_executables` with zero exceptions.
- `getOne` is the only approved pattern for SELECT queries (returns `T | null`).
- `getReturned` is the only approved pattern for INSERT/UPDATE + `.returning()` queries (returns `T`).
- The guard must be verified to actually run and catch violations — no dead rule.
- Guard rule should also cover any future files in new `_repositories` or `_executables` folders added anywhere in the repo.

## Why
If the guard doesn't enforce it, the wrappers are suggestions, not constraints. `undefined` will leak the moment someone writes `.get()` directly without thinking.

## Status
`ban-drizzle-raw-get` policy created and registered. Needs verification that it runs clean and catches violations in the brain repo and elsewhere.
