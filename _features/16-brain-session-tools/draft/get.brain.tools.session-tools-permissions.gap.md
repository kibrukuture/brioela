# Draft: get.brain.tools.ts session tools permissions (gap — partial shipped)

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts` (modify)

**Shipped:** `sessionKindSchema`, `TOOL_PERMISSIONS`, `getBrainTools` — memory/recipe/alarm tools only.

**Gap (feature 16):** Register `load_session_context` and `search_session_history` with permissions per implementable specs **16** / **17**.

**Obsolete:** Ledger `0006` — `general` kind, cooking denied, maintenance gets load, search on `session_turns_fts`. **Reject ledger; prefer specs.**

---

## Intended diff (full snapshot — not yet applied)

```typescript
import { loadSessionContextTool } from '@/agents/brain/_tools/load.session.context.tool'
import { searchSessionHistoryTool } from '@/agents/brain/_tools/search.session.history.tool'

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'view_user_recipe',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'load_session_context',
		'search_session_history',
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'load_session_context',
		'search_session_history',
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
		'load_session_context',
	],
	brain_maintenance: [
		'write_user_memory',
		'update_user_recipe',
		'archive_user_recipe',
		'schedule_user_alarm',
	],
	behavior_pattern_detection: [
		'log_memory_event',
		'write_user_memory',
		'schedule_user_alarm',
	],
}

export function getBrainTools(
	db: BrainDatabase,
	userId: string,
	kind: SessionKind,
	activeSessionId: string | null = null,
	waitUntil?: (promise: Promise<void>) => void,
	wake?: AlarmWakeCallbacks,
) {
	const allowed = new Set(TOOL_PERMISSIONS[kind])

	const all = {
		log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
		write_user_memory: writeUserMemoryTool(db, userId),
		read_user_memory: readUserMemoryTool(db, userId, waitUntil),
		view_user_recipe: viewUserRecipeTool(db),
		update_user_recipe: updateUserRecipeTool(db, userId),
		archive_user_recipe: archiveUserRecipeTool(db),
		schedule_user_alarm: wake ? scheduleUserAlarmTool(db, userId, wake) : undefined,
		cancel_user_alarm: wake ? cancelUserAlarmTool(db, userId, wake) : undefined,
		load_session_context: loadSessionContextTool(db, userId),
		search_session_history: searchSessionHistoryTool(db, userId),
	}

	return Object.fromEntries(
		Object.entries(all).filter(([name, tool]) => allowed.has(name) && tool !== undefined),
	)
}
```

## Permission matrix (canonical)

| `SessionKind` | `load_session_context` | `search_session_history` | Rationale |
|---|---|---|---|
| `chat` | ✓ | ✓ | Spec **16** + **17** |
| `cooking` | ✓ | ✓ | Spec **16** requires load at cooking start |
| `alarm` | ✓ | ✗ | Spec **16** load at alarm start; no user to query history |
| `brain_maintenance` | ✗ | ✗ | Spec **16**: maintenance reads directly |
| `behavior_pattern_detection` | ✗ | ✗ | Same as maintenance |

## Conflicts resolved

| Source | Claim | Resolution |
|---|---|---|
| Ledger **0006** | `general` gets both | `general` not a `SessionKind` |
| Ledger **0006** | `cooking` gets neither | **Reject** — spec **16** requires cooking |
| Ledger **0006** | `brain_maintenance` gets load | **Reject** — spec **16** forbids maintenance |
| `02-tool-protocol.md` | Both chat, cooking only | Accept; extend load to alarm |

**20** orchestration: pass `activeSessionId` as default `current_session_id` in first-turn tool call if agent omits it — optional enhancement, not in **16** schema (agent supplies UUID).
