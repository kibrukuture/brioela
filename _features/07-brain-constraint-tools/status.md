# Status

open

`constraints` Drizzle schema exists in `backend/`. **No constraint tools, repositories, registry entries, or tests.** Feature is **not** done per full spec.

# Shipped in backend (partial)

- [x] `constraints` Drizzle schema — five types, four entity kinds, four statuses, evidence JSON array CHECK
- [x] Indexes: `constraints_type_status_index`, `constraints_entity_status_index`, `constraints_surfaced_index` (partial on `proposed`)
- [x] Schema aligned with `implementable-specs/06-constraints.md` (indexes via ledger 0001.schema-indexes-alignment)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `propose_user_constraint` tool (split layout) | No `_tools/*constraint*` files |
| G2 | No `confirm_user_constraint` tool | Same |
| G3 | No `read.user.constraint.repository.ts` / `write.user.constraint.repository.ts` | `_repositories/index.ts` |
| G4 | Tools not in `getBrainTools()` / `TOOL_PERMISSIONS` | `get.brain.tools.ts` |
| G5 | No `constraint.tool.test.ts` | Ledger 0003 verification plan |
| G6 | Session prompt Block 2 not built | **15-brain-system-prompt** — build guide loads `confirmed` only vs spec “all non-rejected” |
| G7 | `sessions.constraints_proposed` not incremented on propose | **07-sessions.md** / session handler |
| G8 | Cooking can propose but not confirm — handoff undefined | Tool protocol: confirm chat-only |
| G9 | Scanner constraint check not wired to live Brain | **24-scanner** — `build-guide/07-scanner/03-constraint-check.md` |
| G10 | Auto-confirm threshold + time-window logic not in code | Agent-side; documented in **15** + **06** |
| G11 | Ledger 0003 body obsolete (scope, pending/active/revoked) | Do not implement from ledger prose |
| G12 | Live chat/session handler does not expose tools | **20-brain-chat-runtime** |
| G13 | `00-overview.md` says constraints change when maintenance runs | Wrong — maintenance never writes (**06-constraints**) |

# Blocked by

- 04-brain-foundation (schema)
- 05-brain-memory-tools (evidence via `log_memory_event` — shipped)

# Blocks

- 15-brain-system-prompt (constraints block)
- 19-brain-tool-registry (tools 09–10 in matrix)
- 20-brain-chat-runtime
- 24-scanner (reads confirmed rows)
- 29-cooking-session (propose during voice)
- 44-kids-mode, 45-in-store-copilot (constraint-aware surfaces)

# Sources

- `implementable-specs/06-constraints.md`
- `implementable-specs/brioela-tools/09-propose-user-constraint.md`
- `implementable-specs/brioela-tools/10-confirm-user-constraint.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/brioela-tools/01-log-memory-event.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/07-scanner/03-constraint-check.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0003.constraint-tools.md`
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/implementation/0001.schema-indexes-alignment.md`

# Draft count

**2** files in `draft/`.
