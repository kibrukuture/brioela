# Draft: Master permission matrix + drift analysis

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts`

Consolidates permission gap drafts from **08**, **09**, **12**, **16**, **18** + **06**, **07** skill/constraint gaps + canonical authority from `build-guide/05-brain/02-tool-protocol.md` and implementable specs.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✓ | Canonical — should be in `TOOL_PERMISSIONS` |
| ✗ | Canonical — must not appear |
| (RPC) | Sub-agent typed Brain RPC only — not public `getBrainTools` |
| **D** | Drift — production differs from canonical |
| **M** | Missing — tool not in `all` map |
| **G** | Gate — permitted but omitted without injection |

---

## Full matrix: canonical vs production

| Tool | chat canon | chat prod | cook canon | cook prod | alarm canon | alarm prod | maint canon | maint prod | pattern canon | pattern prod | Shipped |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `log_memory_event` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | Y |
| `write_user_memory` | ✓ | ✓ | ✓ | ✓ | ✓‡ | ✓ | ✗ | ✓ **D** | ✓ | ✓ | Y |
| `read_user_memory` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Y |
| `create_user_skill` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `update_user_skill` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | (RPC) | ✗ | ✗ | ✗ | N |
| `view_user_skill` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `archive_user_skill` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | (RPC) | ✗ | ✗ | ✗ | N |
| `delete_user_skill` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `propose_user_constraint` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `confirm_user_constraint` | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `schedule_user_alarm` | ✓ | ✓ **G** | ✓ | ✓ **G** | ✗ | ✗ | (RPC) | ✓ **D G** | (RPC) | ✓ **D G** | Y |
| `cancel_user_alarm` | ✓ | ✓ **G** | ✓ | ✓ **G** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Y |
| `view_user_recipe` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Y |
| `update_user_recipe` | ✓ | ✗ **D** | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ **D** | ✗ | ✗ | Y |
| `archive_user_recipe` | ✓ | ✗ **D** | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ **D** | ✗ | ✗ | Y |
| `load_session_context` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | N |
| `search_session_history` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |
| `search_web` | ✓ | ✗ **M** | ✓ | ✗ **M** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | N |

‡ Build-guide line 110 omits alarm; tool spec **02** + alarm session flow → **prefer ✓** (document as G11).

**G (wake gate):** All `schedule/cancel` cells marked **G** in production — matrix allows tool but `wake` undefined strips from return value (**09** G2).

---

## Missing tools summary (10)

| Tool | Owner feature | Gap draft reference |
|---|---|---|
| `create_user_skill` | **06** | `_features/06-brain-skill-tools/draft/get.brain.tools.skill-gap.md` |
| `update_user_skill` | **06** | same |
| `view_user_skill` | **06** | same |
| `archive_user_skill` | **06** | same |
| `delete_user_skill` | **06** | same |
| `propose_user_constraint` | **07** | `_features/07-brain-constraint-tools/draft/get.brain.tools.constraint-gap.md` |
| `confirm_user_constraint` | **07** | same |
| `load_session_context` | **16** | `_features/16-brain-session-tools/draft/get.brain.tools.session-tools-permissions.gap.md` |
| `search_session_history` | **16** | same |
| `search_web` | **18** | `_features/18-brain-web-search/draft/get.brain.tools.web-search-permissions.gap.md` |

---

## Drift-only (shipped but wrong permissions)

| Issue | Fix | Owner |
|---|---|---|
| **08 G1** — chat missing update/archive recipe | Add to `chat`; remove from `brain_maintenance` | **19** registry + **08** test update |
| **G6** — maintenance public row | Empty public row; RPC in **12** | **19** + **12** |
| **G7** — behavior_pattern public row | Empty public row; RPC in **12** | **19** + **12** |
| **G11** — alarm write_user_memory | Decide: keep (spec **02**) or drop (build-guide) | **19** spec call |

---

## Sub-agent / maintenance tools (NOT public registry)

Do **not** add to `getBrainTools` `all` map. See `spec.md` maintenance table + `_features/12-brain-sub-agents/draft/get.brain.tools.sub-agent-permissions.md`.

---

## Obsolete ledger matrices — reject

| Ledger | Wrong claims |
|---|---|
| **0005** | Recipe update/archive on `brain_maintenance` |
| **0006** | `general` kind; cooking denied session tools; maintenance gets load; `session_turns_fts` |
| **0007** | `general` only; cooking denied web; Brave API |

---

## Intended `TOOL_PERMISSIONS` (live-session kinds only)

Sub-agent kinds should use **empty arrays** in public registry (RPC path). When **24** ships, add `product_scan` row.

```typescript
const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'create_user_skill',
		'update_user_skill',
		'view_user_skill',
		'archive_user_skill',
		'delete_user_skill',
		'propose_user_constraint',
		'confirm_user_constraint',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'load_session_context',
		'search_session_history',
		'search_web',
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'create_user_skill',
		'update_user_skill',
		'view_user_skill',
		'archive_user_skill',
		'delete_user_skill',
		'propose_user_constraint',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'load_session_context',
		'search_session_history',
		'search_web',
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
		'load_session_context',
	],
	brain_maintenance: [],
	behavior_pattern_detection: [],
}
```

Full intended file with imports: `get.brain.tools.intended-full-registry.md`.
