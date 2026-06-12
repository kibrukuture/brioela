# Draft: safety-filter.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/safety-filter.ts`

**Gap (feature 52):** PII / safety-surface / safetyLock enforcement — fail closed.

**Source:** `15-validation-and-repair.md`, `06-surface-integration.md`

---

```typescript
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import type { ComposeBrioelaGenerativeUiInput } from './compose-brioela-generative-ui'

const BLOCKED_CONTENT_PATTERNS = [
	/allergy hard block/i,
	/medical condition flag/i,
	/recall alert/i,
] as const

export type SafetyFilterResult =
	| { ok: true; document: BrioelaGenerativeUiDocument }
	| { ok: false; reason: string }

export function runBrioelaGenerativeUiSafetyFilter(
	document: BrioelaGenerativeUiDocument,
	input: ComposeBrioelaGenerativeUiInput,
): SafetyFilterResult {
	if (input.safetyLock && !document.safetyLock) {
		return { ok: false, reason: 'safety_lock_mismatch' }
	}

	const serialized = JSON.stringify(document.content)
	for (const pattern of BLOCKED_CONTENT_PATTERNS) {
		if (pattern.test(serialized)) {
			return { ok: false, reason: 'safety_surface_content' }
		}
	}

	// payload binding: reject fields not in approved payload keys
	const payloadKeys = new Set(Object.keys(input.payload))
	// feature-specific scrubbers extend this list

	void payloadKeys

	return { ok: true, document }
}
```
