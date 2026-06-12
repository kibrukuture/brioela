# Brain Tool Registry — Build

Feature **19**. Production paths for `getBrainTools`, `sessionKindSchema`, `TOOL_PERMISSIONS`, `_tools/index.ts`, and registry-level tests.

**Depends on:** **04** Brain DO + `_tools/` folder; partial tools from **05**, **08**, **09**.  
**Blocks:** **20** (session tool surface); completion of **06**, **07**, **16**, **18** registry rows.

---

## Shipped today

| Area | Status |
|---|---|
| `get.brain.tools.ts` — enum, matrix, filter, 8-tool `all` map | ✓ partial |
| `sessionKindSchema` (5 kinds) | ✓ |
| Memory tools in registry (**05**) | ✓ |
| Recipe tools in registry (**08**) | ✓ (permissions drift) |
| Alarm tools in registry (**09**) | ✓ (wake-gated; no live caller) |
| Skill tools (**06**) | ✗ not in map |
| Constraint tools (**07**) | ✗ not in map |
| Session tools (**16**) | ✗ not in map |
| `search_web` (**18**) | ✗ not in map |
| `_tools/index.ts` barrel | ✓ partial (no alarm exports) |
| Registry integration test covering full 18-tool matrix | ✗ |
| `product_scan` SessionKind | ✗ deferred **24** |
| Sub-agent RPC registry (**12**) | ✗ separate from this file |

---

## File manifest

### Registry (this feature)

| File | Role |
|---|---|
| `_tools/get.brain.tools.ts` | `sessionKindSchema`, `TOOL_PERMISSIONS`, `getBrainTools()` |
| `_tools/index.ts` | Barrel — export registry + public tool factories |
| `_tools/registry.tool.test.ts` | Matrix + gate tests (recommended — not shipped) |

### Per-tool registration (owned by **05–18**)

Each shipped tool adds:

1. Import in `get.brain.tools.ts`
2. Permission rows per `SessionKind`
3. Factory entry in `all` map (with gates if needed)
4. Optional `index.ts` re-export

| Feature | Tools to register |
|---|---|
| **05** | `log_memory_event`, `write_user_memory`, `read_user_memory` — shipped |
| **06** | `create/update/view/archive/delete_user_skill` — gap |
| **07** | `propose_user_constraint`, `confirm_user_constraint` — gap |
| **08** | `view/update/archive_user_recipe` — shipped; fix permissions |
| **09** | `schedule/cancel_user_alarm` — shipped |
| **16** | `load_session_context`, `search_session_history` — gap |
| **18** | `search_web` — gap |

---

## `getBrainTools` completion checklist

### Signature (target)

```typescript
export function getBrainTools(
  db: BrainDatabase,
  userId: string,
  kind: SessionKind,
  activeSessionId: string | null = null,
  waitUntil?: (promise: Promise<void>) => void,
  wake?: AlarmWakeCallbacks,
  env?: Pick<Env, 'TAVILY_API_KEY' | 'EXA_API_KEY'>,
  sessionWebSearchCounter?: SessionWebSearchCounter,
)
```

### `all` map (18 entries when complete)

```typescript
const all = {
  log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
  write_user_memory: writeUserMemoryTool(db, userId),
  read_user_memory: readUserMemoryTool(db, userId, waitUntil),
  create_user_skill: createUserSkillTool(db, userId),
  update_user_skill: updateUserSkillTool(db, userId),
  view_user_skill: viewUserSkillTool(db, userId),
  archive_user_skill: archiveUserSkillTool(db, userId),
  delete_user_skill: deleteUserSkillTool(db, userId),
  propose_user_constraint: proposeUserConstraintTool(db, userId, activeSessionId),
  confirm_user_constraint: confirmUserConstraintTool(db, userId),
  schedule_user_alarm: wake ? scheduleUserAlarmTool(db, userId, wake) : undefined,
  cancel_user_alarm: wake ? cancelUserAlarmTool(db, userId, wake) : undefined,
  view_user_recipe: viewUserRecipeTool(db),
  update_user_recipe: updateUserRecipeTool(db, userId),
  archive_user_recipe: archiveUserRecipeTool(db),
  load_session_context: loadSessionContextTool(db, userId),
  search_session_history: searchSessionHistoryTool(db, userId),
  search_web:
    env && sessionWebSearchCounter
      ? searchWebTool(db, userId, activeSessionId, env, sessionWebSearchCounter, waitUntil)
      : undefined,
}
```

### Permission fixes (registry-only, no new executables)

1. **Recipe (**08** G1):** Add `update_user_recipe`, `archive_user_recipe` to `chat`; remove both from `brain_maintenance`.
2. **Maintenance stub:** Remove or empty `brain_maintenance` / `behavior_pattern_detection` public rows — sub-agents use RPC (**12**).
3. **Session (**16**):** Add `load_session_context` + `search_session_history` to `chat`/`cooking`; add `load_session_context` to `alarm` only.
4. **Web (**18**):** Add `search_web` to `chat`, `cooking`.
5. **Skills (**06**):** Full skill pentad on `chat`/`cooking`; `update_user_skill` + `archive_user_skill` on maintenance RPC path only (not public map).
6. **Constraints (**07**):** `propose` on `chat`+`cooking`; `confirm` on `chat` only.

---

## Barrel (`index.ts`) target

Export at minimum:

- `getBrainTools`, `sessionKindSchema`, `SessionKind`
- All `.tool.ts` factories (memory, skill, constraint, alarm, recipe, session, web)

Today missing alarm re-exports.

---

## Acceptance criteria

### Registry core

- [ ] `sessionKindSchema` parses all live session kinds used by **20**
- [ ] `TOOL_PERMISSIONS` matches canonical matrix in `spec.md` (zero drift rows)
- [ ] `all` map contains factories for all 18 public tools when implementations exist
- [ ] Filter removes undefined gated tools (`wake`, `env`+counter)
- [ ] `getBrainTools` never registers maintenance-only RPC tool names in public set

### Per-kind smoke (after **20** or dedicated test)

- [ ] `getBrainTools(..., 'chat')` returns full chat matrix (with `wake` + env for alarm/web)
- [ ] `getBrainTools(..., 'cooking')` includes recipe write + `search_web` when wired
- [ ] `getBrainTools(..., 'alarm')` — memory + load only; no search/web/skills
- [ ] `getBrainTools(..., 'brain_maintenance')` — empty or throws; RPC path used instead

### Gates

- [ ] Without `wake`, permitted alarm tools absent from return value
- [ ] Without `env`+counter, `search_web` absent even when permitted
- [ ] With `wake`, alarm tools present for chat/cooking/maintenance kinds per matrix

### Tests

- [ ] `registry.tool.test.ts` (or extend `memory.tool.test.ts`) asserts matrix per kind
- [ ] `recipe.tool.test.ts` updated when **08** G1 fixed (chat gets update/archive)
- [ ] No test codifies wrong maintenance recipe permissions

### Boundaries

- [ ] **12** maintenance tools documented as RPC-only — not added to `all`
- [ ] **24** adds `product_scan` to enum + `search_web`/`propose`/`log`/`write` rows when ready
- [ ] Guard/lexicon tools never imported in registry

---

## Verification commands

```bash
rg 'TOOL_PERMISSIONS|getBrainTools|sessionKindSchema' backend/src/agents/brain/_tools
rg '\.tool\.ts' backend/src/agents/brain/_tools --glob '*.tool.ts'
cd backend && bun run brain:test
bun run verify
```

---

## 19 vs neighbors

| Step | Feature | Relationship |
|---|---|---|
| Tool bodies | **05–18** | Implement split layout; **19** registers |
| Wake injection | **09**, **14** | `AlarmWakeCallbacks` passed by **20** |
| Web injection | **18**, **20** | `env` + counter |
| Sub-agent tools | **12** | RPC — not `getBrainTools` public set |
| Session handler | **20** | Sole production caller of `getBrainTools` |
| Scanner kind | **24** | Extends enum + permission rows |

---

## Draft artifacts

See `draft/` — production snapshots + intended full registry + master permissions gap analysis.
