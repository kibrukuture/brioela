# Draft: format.personality.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.personality.helper.ts`

**Gap (feature 15):** Block 3 formatter. Top-N truncation happens in repository — not here.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainUserPersonality } from '@/agents/brain/_schemas'

export function formatPersonality(traits: BrainUserPersonality[]): string {
	const lines: string[] = [
		'## User personality',
		'Inferred behavioral patterns (Brain maintenance). Apply gently — not diagnoses.',
		'',
	]

	for (const trait of traits) {
		const strength = trait.strength.toFixed(2)
		lines.push(`- ${trait.trait} (strength ${strength}): ${trait.description}`)
	}

	return lines.join('\n')
}
```

Source: `implementable-specs/03-user-personality.md`; `build-guide/06-brain-memory/01-sqlite-schema.md`.
