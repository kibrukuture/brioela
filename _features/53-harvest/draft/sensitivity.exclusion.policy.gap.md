# Draft: sensitivity.exclusion.policy.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_policies/harvest/sensitivity.exclusion.policy.ts`

**Gap (feature 53):** Candidate-layer hard exclusion — downstream never sees excluded material.

**Source:** `build-guide/36-harvest/02-chapter-rules.md` § Hard Exclusion List

---

```typescript
import type { HarvestChapterCandidate } from '@brioela/shared/validator/harvest'

const EXCLUDED_ENTITY_KINDS = new Set([
	'illness_event',
	'medical_condition',
	'medication',
	'glucose_reading',
	'guest_constraint',
	'craving_history',
	'precise_location',
])

const EXCLUDED_QUERY_ID_PREFIXES = [
	'illness.',
	'medical.',
	'medication.',
	'glucose.',
	'guest.',
	'craving.',
	'location.precise.',
]

export function isHarvestCandidateExcluded(candidate: HarvestChapterCandidate): boolean {
	if (candidate.entityKind && EXCLUDED_ENTITY_KINDS.has(candidate.entityKind)) {
		return true
	}

	return candidate.sourceQueries.some((q) =>
		EXCLUDED_QUERY_ID_PREFIXES.some((prefix) => q.queryId.startsWith(prefix)),
	)
}

export function filterHarvestCandidates(
	candidates: HarvestChapterCandidate[],
): HarvestChapterCandidate[] {
	return candidates.filter((c) => !isHarvestCandidateExcluded(c))
}
```
