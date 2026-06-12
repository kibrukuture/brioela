# Draft: build.system.prompt.handler.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/build.system.prompt.handler.test.ts`

**Gap (feature 15):** No tests for block order or namespace selection.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, it } from 'vitest'
import { getRelevantNamespaces } from '@/agents/brain/_helpers/get.relevant.namespaces.helper'

describe('getRelevantNamespaces', () => {
	it('returns cooking namespaces for cooking sessions', () => {
		expect(getRelevantNamespaces('cooking')).toEqual([
			'health',
			'cooking',
			'life.dietary',
			'health.medications',
		])
	})

	it('returns default namespaces for chat sessions', () => {
		expect(getRelevantNamespaces('chat')).toEqual([
			'health',
			'life',
			'cooking.preferences',
		])
	})

	it('returns default namespaces for alarm and background sessions', () => {
		expect(getRelevantNamespaces('alarm')).toEqual([
			'health',
			'life',
			'cooking.preferences',
		])
		expect(getRelevantNamespaces('background')).toEqual([
			'health',
			'life',
			'cooking.preferences',
		])
	})
})

// Integration tests for buildSystemPrompt require in-memory Brain DB fixture:
// - assert BrioelaIdentity is first segment when 10 shipped
// - assert join separator \n\n---\n\n between non-empty blocks
// - assert session_watchdog excluded from pending alarms block
// - assert empty blocks omitted
```

Source: `_features/15-brain-system-prompt/build.md` acceptance criteria.
