# Inventory — How to Use

Every spec file that exists in this project is listed here, one file per area.

## Status markers
- `[ ]` not yet read or processed into build-guide
- `[~]` partially processed — some build-guide files exist but not all connections made
- `[x]` fully processed — all connections mapped, all build-guide files written for this spec

## Files in this folder
Each numbered file covers one spec area:
- `01-brioela-specs.md` — all files in `brioela-specs/`
- `02-cooking-session-specs.md` — all files in `implementable-specs/cooking-session/`
- `03-bela-specs.md` — all files in `implementable-specs/bela/`
- `04-other-specs.md` — any other spec files found during full inventory pass

## When to update
Every time a new spec file is created anywhere in the project, add it here immediately.
Every time a build-guide file is written from a spec, update the status marker.

## Recovery
If you are reading this after context compaction: check `_records/session-log/` and read
the LAST numbered file there. That tells you what was in progress and what is next.
