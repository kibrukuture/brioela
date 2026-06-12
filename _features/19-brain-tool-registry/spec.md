# Brain Tool Registry — Spec

Feature **19**. The cross-cutting **tool protocol shell**: `getBrainTools()`, `sessionKindSchema`, `TOOL_PERMISSIONS`, the `all` tool map, conditional registration gates (`wake`, `env`, counters), and `_tools/index.ts` barrel exports.

**Not in this feature:** individual tool implementations (**05–18**); maintenance-only RPC tools and `_policies/` caller enforcement (**12**); live session handler that invokes `getBrainTools` (**20**); guard/lexicon/reading-gate tooling.

---

## Purpose

Every LLM write to Brain SQLite flows through AI SDK `tool()` definitions registered per session. **19** owns the **registry** — which tools exist in the `all` map, which names each `SessionKind` may expose, and how runtime dependencies are injected — not the executables inside each tool folder.

Adding a capability = implement split layout under `_tools/` (**05–18**) + one row in `TOOL_PERMISSIONS` + one entry in the `all` map + optional barrel export.

---

## Core contract

### `sessionKindSchema`

Production enum (`get.brain.tools.ts:13`):

```typescript
export const sessionKindSchema = z.enum([
  'chat',
  'cooking',
  'alarm',
  'brain_maintenance',
  'behavior_pattern_detection',
])
export type SessionKind = z.infer<typeof sessionKindSchema>
```

| Kind | Role |
|---|---|
| `chat` | Default user-facing text session |
| `cooking` | Voice/cooking session (Mira path) |
| `alarm` | DO alarm handler session (**14**) |
| `brain_maintenance` | BrainMaintenanceAgent run context — **prefer typed Brain RPC, not live `getBrainTools`** (**12**, spec **15**) |
| `behavior_pattern_detection` | BehaviorPatternAgent run context — **prefer typed Brain RPC** (**12**, spec **15**) |

**Deferred kinds (not in enum today):**

| Kind | Owner | Notes |
|---|---|---|
| `product_scan` | **24-scanner** | Spec **18** reserves `search_web` permission; add to enum when scanner ships |
| `compressor` | **13** / **17** | Spec **15** documents `compressor: []` — no public tools; not in enum (**12** G14) |

**DB mapping gap:** `sessions.session_type` uses `background` for sub-agent rows, not `brain_maintenance` / `behavior_pattern_detection` (**11** G14). **19** does not define the mapper — **11** / **20** must translate DB → `SessionKind`.

---

### `getBrainTools` signature

```typescript
export function getBrainTools(
  db: BrainDatabase,
  userId: string,
  kind: SessionKind,
  activeSessionId: string | null = null,
  waitUntil?: (promise: Promise<void>) => void,
  wake?: AlarmWakeCallbacks,
  // Future (**18** + **20**):
  // env?: Pick<Env, 'TAVILY_API_KEY' | 'EXA_API_KEY'>,
  // sessionWebSearchCounter?: SessionWebSearchCounter,
)
```

Returns `Record<string, Tool>` — only keys in `TOOL_PERMISSIONS[kind]` **and** with a defined factory result (see gates below).

**Authority:** `build-guide/05-brain/02-tool-protocol.md` (registration pattern, alarm wake injection).

---

### Registration gates (conditional tools)

| Tool(s) | Gate | If omitted |
|---|---|---|
| `schedule_user_alarm`, `cancel_user_alarm` | `wake?: AlarmWakeCallbacks` | Tools omitted from returned map even when permitted (**09** G2) |
| `search_web` (not shipped) | `env` + `sessionWebSearchCounter` | Tool omitted (**18** G4) |
| `read_user_memory` | `waitUntil` optional | Tool still registers; vector side effects may skip without `waitUntil` |

`AlarmWakeCallbacks` (`schedule.user.alarm.executable`):

```typescript
type AlarmWakeCallbacks = {
  scheduleAlarm: (scheduledAtMs: number) => Promise<void>
  cancelAlarm: () => Promise<void>
}
```

**20** must pass `wake` from Brain DO alarm slot management. Today no production caller passes `wake` (**09** G2, **14** G3).

---

### Filter algorithm

```typescript
const allowed = new Set(TOOL_PERMISSIONS[kind])
return Object.fromEntries(
  Object.entries(all).filter(([name, tool]) => allowed.has(name) && tool !== undefined),
)
```

Permission alone is insufficient — undefined factories are stripped.

---

## Tool inventory (18 public SQLite + 1 external)

Catalog authority: `implementable-specs/brioela-tools/00-index.md` + `build-guide/05-brain/02-tool-protocol.md`.

**Ignore for public registry:** guard/lexicon/reading-gate tooling; maintenance-only read/write RPC tools from spec **15** (listed separately below).

### Shipped vs missing (production `all` map)

| # | Tool | Impl feature | In `all` map | In `TOOL_PERMISSIONS` | Tool file exists |
|---|---|---|---|---|---|
| 01 | `log_memory_event` | **05** | Y | partial | Y |
| 02 | `write_user_memory` | **05** | Y | partial | Y |
| 03 | `read_user_memory` | **05** | Y | partial | Y |
| 04 | `create_user_skill` | **06** | N | N | N |
| 05 | `update_user_skill` | **06** | N | N | N |
| 06 | `view_user_skill` | **06** | N | N | N |
| 07 | `archive_user_skill` | **06** | N | N | N |
| 08 | `delete_user_skill` | **06** | N | N | N |
| 09 | `propose_user_constraint` | **07** | N | N | N |
| 10 | `confirm_user_constraint` | **07** | N | N | N |
| 11 | `schedule_user_alarm` | **09** | Y (wake-gated) | partial | Y |
| 12 | `cancel_user_alarm` | **09** | Y (wake-gated) | partial | Y |
| 13 | `view_user_recipe` | **08** | Y | partial | Y |
| 14 | `update_user_recipe` | **08** | Y | partial | Y |
| 15 | `archive_user_recipe` | **08** | Y | partial | Y |
| 16 | `load_session_context` | **16** | N | N | N |
| 17 | `search_session_history` | **16** | N | N | N |
| 18 | `search_web` | **18** | N | N | N |

**Shipped tool files (8):** `log.memory.event`, `write.user.memory`, `read.user.memory`, `view.user.recipe`, `update.user.recipe`, `archive.user.recipe`, `schedule.user.alarm`, `cancel.user.alarm`.

---

## Master permission matrix — canonical (spec authority)

Derived from `build-guide/05-brain/02-tool-protocol.md` + implementable tool specs + cross-feature gap resolutions (**08** G1, **16** G20, **18** spec, **15** hard boundaries).

✓ = permitted for that `SessionKind` in the **live-session** public registry.  
(RPC) = allowed only via typed Brain RPC for sub-agents, not via `getBrainTools` public set.

| Tool | chat | cooking | alarm | brain_maint | behavior_pattern | product_scan† |
|---|---|---|---|---|---|---|
| `log_memory_event` | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| `write_user_memory` | ✓ | ✓ | ✓‡ | ✗ | ✓ (pattern.* via RPC policy) | ✓ |
| `read_user_memory` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `create_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `update_user_skill` | ✓ | ✓ | ✗ | (RPC) | ✗ | ✗ |
| `view_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `archive_user_skill` | ✓ | ✓ | ✗ | (RPC) | ✗ | ✗ |
| `delete_user_skill` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `propose_user_constraint` | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| `confirm_user_constraint` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `schedule_user_alarm` | ✓ | ✓ | ✗ | (RPC) | (RPC) | ✗ |
| `cancel_user_alarm` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `view_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `update_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `archive_user_recipe` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `load_session_context` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| `search_session_history` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `search_web` | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |

† `product_scan` not in `sessionKindSchema` today — **24** adds enum + permission row.  
‡ Build-guide table omits `alarm`; tool spec **02** says "any active session"; **16** alarm flow needs memory writes — **prefer ✓ for alarm** (document drift vs build-guide line 110).

---

## Production drift table (canonical vs shipped `TOOL_PERMISSIONS`)

| Tool | Kind | Canonical | Production | Drift |
|---|---|---|---|---|
| `update_user_recipe` | `chat` | ✓ | ✗ | **08 G1** |
| `archive_user_recipe` | `chat` | ✓ | ✗ | **08 G1** |
| `update_user_recipe` | `brain_maintenance` | ✗ | ✓ | **08 G1** + spec **15** hard boundary |
| `archive_user_recipe` | `brain_maintenance` | ✗ | ✓ | **08 G1** + spec **15** hard boundary |
| `write_user_memory` | `brain_maintenance` | ✗ (RPC only) | ✓ | **12 G2/G3** + spec **15** |
| `log_memory_event` | `brain_maintenance` | ✗ | ✗ | match |
| `create_user_skill` … `delete_user_skill` | `chat`, `cooking` | ✓ each | ✗ all | **06 G7** |
| `update/archive_user_skill` | `brain_maintenance` | RPC | ✗ | **06 G7** + **12** |
| `propose/confirm_user_constraint` | `chat` (+ propose cooking) | ✓ | ✗ | **07 G4** |
| `load_session_context` | `chat`, `cooking`, `alarm` | ✓ | ✗ | **16 G5/G20** |
| `search_session_history` | `chat`, `cooking` | ✓ | ✗ | **16 G5** |
| `search_web` | `chat`, `cooking` | ✓ | ✗ | **18 G4** |
| `schedule/cancel_user_alarm` | all permitted kinds | ✓ if `wake` | omitted without `wake` | **09 G2** (runtime, not matrix) |

Tests codify recipe drift: `recipe.tool.test.ts:125` expects `chat` has view-only (no update/archive).

---

## Maintenance-only tools (NOT in public `getBrainTools` set)

From `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`. Enforced via typed Brain RPC + `_policies/sub.agent.tool.policy.ts` (**12**), not the 18-tool public map.

| Tool | brain_maintenance | behavior_pattern_detection |
|---|---|---|
| `get_skills_for_brain_maintenance` | ✓ | ✗ |
| `get_personality_traits_for_brain_maintenance` | ✓ | ✓ |
| `get_user_memory_for_brain_maintenance` | ✓ | ✓ |
| `get_memory_events_since` | ✗ | ✓ |
| `update_personality_trait` | ✓ | ✗ |
| `archive_personality_trait` | ✓ | ✗ |
| `create_personality_trait` | ✓ | ✗ |
| `check_active_session` | internal | internal |

Forwarded from the 18-tool set via RPC (not public registry): `update_user_skill`, `archive_user_skill`, `schedule_user_alarm`, `write_user_memory` (behavior: `pattern.*` namespace only).

**Resolution:** Shipped `brain_maintenance` / `behavior_pattern_detection` rows in `get.brain.tools.ts` are **wrong stubs** — sub-agents must not rely on them (**12** draft). **19** ships correct matrix for live kinds; **12** ships RPC surface.

---

## Tool registration pattern (split layout)

Every tool under `backend/src/agents/brain/_tools/`:

| Subfolder | Suffix | Barrel |
|---|---|---|
| `_prompts/` | `.prompt.ts` | `_prompts/index.ts` |
| `_schemas/` | `.schema.ts` | `_schemas/index.ts` |
| `_executables/` | `.executable.ts` | `_executables/index.ts` |
| Root | `.tool.ts` | `_tools/index.ts` (optional re-export) |

Rules (`02-tool-protocol.md`, ledger **0008**):

- Zod from `@brioela/shared/zod` only
- Executable exports mirror file stem (`writeUserMemoryExecutable`, not `writeUserMemoryExecute`)
- No banned lexicon parameter names (`input`, `output`, `result`, `payload` as identifiers)
- AI-facing tool **names** are snake_case strings owned by implementable specs (e.g. `log_memory_event`)

Folder name in production is `_executables` (plural) — ledger **0008** law applies.

---

## Barrel exports (`_tools/index.ts`)

**Shipped today** — exports `get.brain.tools` + memory trio + recipe trio. **Missing:** alarm tools (`schedule.user.alarm`, `cancel.user.alarm`), future tools as they land.

Convention: export tool factories and registry types from barrel; sub-artifacts imported directly by tool files.

---

## Feature boundaries

| Feature | Owns |
|---|---|
| **19** | Registry shell, `SessionKind`, `TOOL_PERMISSIONS`, `getBrainTools`, barrel, injection contracts |
| **05–18** | Individual tool split files + executables |
| **12** | Maintenance RPC tools + caller policy (not public 18-tool map) |
| **20** | Calls `getBrainTools(db, userId, kind, activeSessionId, waitUntil, wake, env, counter)` per turn/session build |

---

## Obsolete / conflicting sources

| Source | Issue | Resolution |
|---|---|---|
| Ledger **0005** body | Grants recipe update/archive to `brain_maintenance` | **Reject** — prefer spec **15** + **08** G1 |
| Ledger **0006** | `general` kind; cooking denied session tools; maintenance gets load; searches `session_turns_fts` | **Reject** — prefer specs **16**/**17** |
| Ledger **0007** | Brave API; `general` only; cooking denied | **Reject** — prefer spec **18** (Tavily+Exa) |
| Spec **15** inline `TOOL_PERMISSIONS` (lines 83–136) | Incomplete vs build-guide (missing view tools, session tools, alarm cancel on cooking, etc.) | **Prefer build-guide + brioela-tools** for live-session matrix; spec **15** for RPC-only tools |
| `brioela-tools/00-index.md` status table | Says all tools "backend pending" | Stale — memory/recipe/alarm partially shipped |
| Build-guide line 124 | FTS on `session_turns` for tool 17 | **Prefer** spec **17** (`sessions_fts`) — **16** G22 |

---

## Sources

- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/brioela-tools/01`–`18` (all tool specs)
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/00-overview.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0001`–`0008`
- `_features/05`–`18` status + permission gap drafts
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
- `backend/src/agents/brain/_tools/index.ts`
