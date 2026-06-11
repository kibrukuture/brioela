# Brain Memory Tools — Build

Feature **05**. Production paths under `backend/src/agents/brain/`.

---

## File manifest

### Schemas

| File | Role |
|---|---|
| `_schemas/memory.event.schema.ts` | Drizzle table + indexes + JSON checks |
| `_schemas/user.memory.schema.ts` | Drizzle table + namespace/key checks + indexes |

### Repositories

| File | Role |
|---|---|
| `_repositories/read.user.memory.repository.ts` | `readUserMemory`, `listUserMemories`, `countUserMemoryNamespaces` |
| `_repositories/write.user.memory.repository.ts` | `writeUserMemory`, `incrementUserMemoryRead` |
| `_repositories/write.memory.event.repository.ts` | `writeMemoryEvent` |
| `_repositories/list.memory.events.repository.ts` | Keyset cursor list for RPC |
| `_repositories/write.memory.event.once.repository.ts` | Idempotent insert (migration smoke) |

### Mapper + RPC types

| File | Role |
|---|---|
| `_mappers/create.memory.event.write.mapper.ts` | `AppendBrainMemoryEvent` → row |
| `_rpc/memory.rpc.ts` | Zod schemas for append + list RPC |

### Tools (split layout)

| File | Role |
|---|---|
| `_tools/log.memory.event.tool.ts` | Wrapper |
| `_tools/_schemas/log.memory.event.schema.ts` | Input Zod |
| `_tools/_prompts/log.memory.event.prompt.ts` | Description string |
| `_tools/_executables/log.memory.event.executable.ts` | Insert logic |
| `_tools/write.user.memory.tool.ts` | Wrapper |
| `_tools/_schemas/write.user.memory.schema.ts` | Input Zod |
| `_tools/_prompts/write.user.memory.prompt.ts` | Description string |
| `_tools/_executables/write.user.memory.executable.ts` | Merge + cap logic |
| `_tools/read.user.memory.tool.ts` | Wrapper |
| `_tools/_schemas/read.user.memory.schema.ts` | Input Zod |
| `_tools/_prompts/read.user.memory.prompt.ts` | Description string |
| `_tools/_executables/read.user.memory.executable.ts` | Read + read_count side effect |

### Registration + DO surface

| File | Role |
|---|---|
| `_tools/get.brain.tools.ts` | `TOOL_PERMISSIONS` + factory (memory tools portion) |
| `_tools/index.ts` | Re-exports |
| `brioela.brain.agent.ts` | `@callable appendMemoryEvent`, `listMemoryEvents` |

### Tests

| File | Role |
|---|---|
| `_tools/memory.tool.test.ts` | DO integration tests for all three executables |

---

## Repository export wiring

`_repositories/index.ts` must export:

- `readUserMemory`, `listUserMemories`, `countUserMemoryNamespaces`
- `writeUserMemory`, `incrementUserMemoryRead`
- `writeMemoryEvent`, `writeMemoryEventOnce`, `listMemoryEvents`

---

## Permission matrix (memory tools only)

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern_detection |
|---|---|---|---|---|---|
| `log_memory_event` | ✓ | ✓ | ✓ | ✗ | ✓ |
| `write_user_memory` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `read_user_memory` | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Verification commands

```bash
cd backend && bun run brain:test -- memory.tool.test.ts
cd backend && bun run verify
```

Expected: 3 tests green in `Brain Memory Tools` describe block.

---

## Draft folder

`draft/` holds frozen TypeScript snapshots copied from production after review. One `.md` file per production file above. After ship approval, copy draft → production word-for-word; live fixes only in `backend/`.

---

## Remaining build work (keeps feature `open`)

1. **G1** — Add optional `importance` to `writeUserMemorySchema`; pass through executable to insert/upsert.
2. **G2** — On cap reject, query distinct namespaces and return in error payload.
3. **G6** — Wire scanner `scan_events` dual-write to `BrioelaBrain.appendMemoryEvent` (feature 26 coordinates).
4. **G5** — Session handler calls `getBrainTools(..., kind, sessionId, waitUntil)` (feature 22).

Do not mark feature `shipped` until G1 and G2 are closed and tests extended. G3–G6 may complete in dependent features but must be tracked in `status.md`.
