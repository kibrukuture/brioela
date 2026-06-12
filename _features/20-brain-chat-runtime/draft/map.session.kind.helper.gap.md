# Draft: map.session.kind.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/map.session.kind.helper.ts`

**Gap (feature 20):** Translate DB `sessions.session_type` + `alarm_type` → `SessionKind` for `getBrainTools`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import {
	sessionKindSchema,
	type SessionKind,
} from '@/agents/brain/_tools/get.brain.tools'
import type { BrainSession } from '@/agents/brain/_schemas'

export function mapSessionTypeToKind(
	sessionType: BrainSession['sessionType'],
	alarmType: BrainSession['alarmType'],
): SessionKind {
	if (sessionType === 'background') {
		if (alarmType === 'behavior_pattern_detection') {
			return 'behavior_pattern_detection'
		}
		return 'brain_maintenance'
	}

	if (sessionType === 'chat' || sessionType === 'cooking' || sessionType === 'alarm') {
		return sessionKindSchema.parse(sessionType)
	}

	throw new Error(`Unsupported session_type for tool registry: ${sessionType}`)
}
```

**11** G14, **19** G15 — background rows use `alarm_type` discriminator; never pass `brain_maintenance` as DB `session_type`.
