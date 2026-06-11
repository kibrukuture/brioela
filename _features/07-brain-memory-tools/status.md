# Status

open

Tools, schemas, repositories, RPC append/list, and tests exist in `backend/`. Feature is **not** fully done per spec — see gaps below. Partial backend does not downgrade scope; we hunt gaps against this folder.

# Shipped in backend (partial)

- [x] `memory_event` + `user_memory` Drizzle schemas
- [x] `log_memory_event`, `write_user_memory`, `read_user_memory` split tools
- [x] Repositories + merge/confidence/cap logic
- [x] `appendMemoryEvent` + `listMemoryEvents` callable RPC on `BrioelaBrain`
- [x] `memory.tool.test.ts` (3 tests)

# Open gaps (hunt list)

| ID | Gap | Owner |
|---|---|---|
| G1 | `importance` not on write tool input | 07 |
| G2 | Namespace cap error missing namespace list | 07 |
| G3 | `loadMemoryForPrompt` | 17-brain-system-prompt |
| G4 | `memory_namespaces` at session start | 18-brain-session-tools |
| G5 | Live chat/session handler tool wiring | 22-brain-chat-runtime |
| G6 | Scanner dual-write via RPC | 26-scanner |
| G7 | Maintenance write permission doc conflict | 07 + 14-brain-sub-agents |

# Blocked by

- 06-brain-foundation

# Blocks

- 08-brain-skill-tools (pattern reference)
- 17-brain-system-prompt (memory prompt load)
- 18-brain-session-tools (namespace list)
- 26-scanner (device event path)
- 34-illness-detective (event history reads)
- 37-ambient-intelligence (event batch reads)

# Sources

- `implementable-specs/01-memory-event.md`
- `implementable-specs/02-user-memory.md`
- `implementable-specs/brioela-tools/01-log-memory-event.md`
- `implementable-specs/brioela-tools/02-write-user-memory.md`
- `implementable-specs/brioela-tools/03-read-user-memory.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0001.first-memory-tools.md`
