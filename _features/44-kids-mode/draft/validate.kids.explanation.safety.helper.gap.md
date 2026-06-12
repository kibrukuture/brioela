# Draft: validate.kids.explanation.safety.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kids.mode/validate.kids.explanation.safety.helper.ts`

**Gap:** No blocked-phrase guard for child-facing copy.

**Source:** `build-guide/21-kids-mode/02-scan-explanation.md`, `05-safety-and-tier-boundary.md`, **37** no-shame overlap

---

```typescript
import type { KidsScanExplanation } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'

const BLOCKED_PHRASES = [
	'this will make you sick',
	'this food is poison',
	'good kids do not eat',
	'this causes adhd',
	'this treats your condition',
	'you should never eat this again',
	'this is scary',
	'this will hurt you',
] as const

export type KidsExplanationSafetyResult =
	| { ok: true }
	| { ok: false; reason: string }

function containsBlockedPhrase(text: string): string | null {
	const normalized = text.toLowerCase()
	for (const phrase of BLOCKED_PHRASES) {
		if (normalized.includes(phrase)) {
			return phrase
		}
	}
	return null
}

export function validateKidsExplanationSafety(
	explanation: KidsScanExplanation,
): KidsExplanationSafetyResult {
	const segments = [
		explanation.verdictSentence,
		...explanation.whySentences,
		explanation.coolFact,
	]

	for (const segment of segments) {
		const blocked = containsBlockedPhrase(segment)
		if (blocked) {
			return { ok: false, reason: `blocked phrase: ${blocked}` }
		}
	}

	return { ok: true }
}
```
