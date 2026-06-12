# Draft: validate.source.queries.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/harvest/validate.source.queries.helper.ts`

**Gap (feature 53):** Anti-hallucination gate — untraceable numbers block chapter ship.

**Source:** `build-guide/36-harvest/01-composition-workflow.md` § Rule

---

```typescript
import type { SourceQueryRef } from '@brioela/shared/validator/harvest'

const NUMBER_PATTERN = /\d+/

export type ValidatedChapterCopy = {
	headline: string
	body: string
	sourceQueries: SourceQueryRef[]
}

export type ValidateSourceQueriesResult =
	| { ok: true; chapter: ValidatedChapterCopy }
	| { ok: false; reason: 'untraceable_number'; token: string }

/**
 * Every numeric token in headline/body must map to a sourceQueries result.
 * If the model invented a number, the chapter does not ship.
 */
export function validateSourceQueriesForChapter(
	headline: string,
	body: string,
	sourceQueries: SourceQueryRef[],
): ValidateSourceQueriesResult {
	const allowedNumbers = new Set(
		sourceQueries.flatMap((q) => {
			if (typeof q.result === 'number') {
				return [String(q.result)]
			}
			if (typeof q.result === 'string' && NUMBER_PATTERN.test(q.result)) {
				return q.result.match(/\d+/g) ?? []
			}
			return []
		}),
	)

	const text = `${headline} ${body}`
	const found = text.match(/\d+/g) ?? []

	for (const token of found) {
		if (!allowedNumbers.has(token)) {
			return { ok: false, reason: 'untraceable_number', token }
		}
	}

	return { ok: true, chapter: { headline, body, sourceQueries } }
}
```
