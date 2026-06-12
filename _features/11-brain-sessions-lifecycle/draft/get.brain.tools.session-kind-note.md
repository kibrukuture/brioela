# Draft: get.brain.tools.session-kind-note.md

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts` (reference — partial shipped)

**Shipped:** `sessionKindSchema` and `TOOL_PERMISSIONS` exist. **Gap:** no helper maps `SessionKind` → DB `session_type` for `openSession`.

---

## Production excerpt (shipped)

```typescript
export const sessionKindSchema = z.enum(['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'])
export type SessionKind = z.infer<typeof sessionKindSchema>

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [ /* memory, recipe, alarm tools */ ],
	cooking: [ /* + update/archive recipe */ ],
	alarm: [ 'log_memory_event', 'write_user_memory' ],
	brain_maintenance: [ /* write memory, recipe archive, schedule alarm */ ],
	behavior_pattern_detection: [ /* log, write, schedule */ ],
}
```

## Mapping needed for session open (11 — not shipped)

```typescript
import type { NewBrainSession } from '@/agents/brain/_schemas'
import type { SessionKind } from '@/agents/brain/_tools/get.brain.tools'

export function sessionKindToSessionType(kind: SessionKind): NewBrainSession['sessionType'] {
	switch (kind) {
		case 'chat':
		case 'cooking':
		case 'alarm':
			return kind
		case 'brain_maintenance':
		case 'behavior_pattern_detection':
			return 'background'
	}
}

export function sessionKindToAlarmType(kind: SessionKind): string | null {
	switch (kind) {
		case 'brain_maintenance':
			return 'brain_maintenance_run'
		case 'behavior_pattern_detection':
			return 'behavior_pattern_detection'
		default:
			return null
	}
}
```

**Conflict:** DB enum includes `background`; tool registry uses maintenance kinds. **11** open path must translate before insert.

**Not in 11:** adding `load_session_context` / `search_session_history` to `TOOL_PERMISSIONS` — **16**.
