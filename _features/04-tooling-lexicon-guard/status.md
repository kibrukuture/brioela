# Status

open

Granular vocabulary split and core guard are built in `tools/brioela-lexicon-guard/`. Ledger marks slice **done** but lists explicit **Not Implemented** and **Next** items — feature stays **open** until those close. Baseline grandfathering means not all violations are eliminated yet.

# Shipped in tools/ (partial)

- [x] TypeScript AST walk + `enforceIdentifierLexiconPolicy`
- [x] Scoped vocabulary: global / backend / product / tools aggregates + 27 slice files
- [x] Baseline v2 grandfathering
- [x] Check, watch, baseline:update CLI
- [x] macOS launchd daemon (start/stop/status/logs)
- [x] Root package.json script wiring + `guard:*` combo commands
- [x] `loadLexicon()` consumed by reading gate (feature 05)

# Open gaps (hunt list)

| ID | Gap |
|---|---|
| G1 | Reject new words in aggregate lexicon files |
| G2 | Require new lexicon files in ownership subfolders |
| G3 | Auto lexicon index generator |
| G4 | Per-word owner metadata on `LexiconWord` |
| G5 | No lexicon guard test suite |
| G6 | Docs folders not scanned |
| G7 | Missing `brioela-specs/00b-naming-lexicon.md` |
| G8 | Cross-tool artifact naming enforcement incomplete here |
| G9 | Baseline shrink / legacy violation cleanup ongoing |

# Blocked by

- 01-platform-foundation

# Blocks

- 05-tooling-reading-gate (nearest-word suggestions via `loadLexicon`)
- All brain/product features that add vocabulary (must wire lexicon slices)

# Sources

- `build-guide/02-coding-standards/03-naming-conventions.md`
- `build-guide/02-coding-standards/13-file-name-enforcement.md` (related — name guard)
- `_records/implementation-ledger/tooling/01-lexicon-guard/0001.granular-vocabulary.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0008.executable-artifact-naming.md`
- `tools/brioela-lexicon-guard/`
