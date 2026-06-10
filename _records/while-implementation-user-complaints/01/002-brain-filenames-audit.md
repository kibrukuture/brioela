# 002 — Audit and Remove "brain" / ".brain" from All File and Folder Names

## Complaint
Too many files and folders still carry the word "brain" or ".brain" in their names. Everything already lives inside `backend/src/agents/brain/` — the context is clear. Repeating "brain" inside that subtree is redundant noise.

## What Needs to Happen
- Do a full audit of every file and folder name under `backend/src/agents/brain/` (and anywhere else in the repo that references the brain agent).
- Remove "brain" / ".brain" from any file or folder name where the context already makes the domain clear.
- Update all import paths and barrel exports to match the renamed files.
- Update any guard baselines that reference the old paths.

## Examples Already Fixed
Repository files: `brain.migration.lock.repository.ts` → `migration.lock.repository.ts` (done).

## Examples Still Needing Audit
- Any remaining `.brain.` segments in file names inside the brain subtree.
- Check `_migrations/`, `_rpc/`, `_database/`, `_mappers/`, `_types/`, `_schemas/` for stale "brain" in names.

## Why
Redundant path segments in names make the codebase harder to grep, harder to read, and violate the principle that context is provided by folder structure, not repeated in every file name.

## Status
Open — partial fix done (repositories), full audit not yet complete.
