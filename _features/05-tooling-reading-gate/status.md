# Status

open

Slice 1 (daemon + manifest + read) and Phase A–E verdict loop (ledger 0004) are **partially** built in `tools/brioela-reading-gate/`. Pre-commit hook, root `verify`, lexicon on the board, attestation, orchestrator, and merge fortress are **not** done. Ledger "done" on slices means those slices landed — not that the full doc 14/15 vision is complete.

# Shipped in tools/ (partial)

- [x] Root daemon + unix socket (`/read`, `/status`, `/verdict`, `/watch`, `/check`)
- [x] Root-owned TSV manifest + freshness (240m TTL + hash)
- [x] Client handlers: up, down, read, status, verdict, watch, smoke, tamper:clear, hooks:install
- [x] ed25519 keys, signed heartbeat, signed green receipts (when board clean + diff hash)
- [x] Guard board (name + type only), board diff, GUARD-RED.md, tamper freeze
- [x] Workspace + tamper watchers (@parcel/watcher)
- [x] 14 unit tests in package
- [x] Lexicon nearest-word suggestions in verdict copy

# Open gaps (hunt list)

| ID | Gap |
|---|---|
| G1 | Lexicon guard not on verdict board |
| G2 | pre-commit hook stub |
| G3 | Root verify unwired |
| G4 | launchd KeepAlive not implemented |
| G5 | No attestation policies |
| G6 | No gate:attest / reading gate:check / rotate-key |
| G7 | No IDE PostToolUse hook in repo |
| G8–G10 | Required Reading + Touched Files + reading pass |
| G11 | Sovereign OS locks not applied |
| G12 | Human sudo acceptance not CI-proven |
| G13 | fs_usage audit optional — not built |
| G14–G20 | Agent loop orchestration (doc 15) entirely unbuilt |

# Blocked by

- 01-platform-foundation
- 04-tooling-lexicon-guard (vocabulary for suggestions; board integration G1)

# Blocks

- All brain/product feature migrations that depend on proof-of-reading workflow
- Ledger entries that should pass through Required Reading gate (G8+)

# Sources

- `build-guide/02-coding-standards/14-reading-gate.md`
- `build-guide/02-coding-standards/15-agent-loop-orchestration.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0001.design.docs.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0002.unforgeable-design.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0003.daemon-manifest-read.md`
- `_records/implementation-ledger/tooling/02-reading-gate/0004.hardened-verdict-loop.md`
- `tools/brioela-reading-gate/`
