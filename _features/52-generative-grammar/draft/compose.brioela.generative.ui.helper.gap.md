# Draft: compose-brioela-generative-ui.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/compose-brioela-generative-ui.ts`

**Gap (feature 52):** Feature handler entry — silence gate → present → validate → filter.

**Source:** `13-how-ai-selects.md`, `20-contracts-and-stage-delivery.md`

---

```typescript
import type { GenerativeSurface } from '@brioela/shared/grammar/schema/surfaces'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import { decideIfWorthEnhancing } from './decide-if-worth-enhancing'
import { presentMomentStructuredOutput } from './present-moment'
import { validateBrioelaGenerativeUi } from './validate-brioela-generative-ui'
import { runBrioelaGenerativeUiSafetyFilter } from './safety-filter'

export type ComposeBrioelaGenerativeUiInput = {
	surface: GenerativeSurface
	payload: Record<string, unknown>
	safetyLock: boolean
	userId: string
}

export async function composeBrioelaGenerativeUi(
	input: ComposeBrioelaGenerativeUiInput,
): Promise<BrioelaGenerativeUiDocument | null> {
	const worthEnhancing = await decideIfWorthEnhancing(input)
	if (!worthEnhancing) {
		return null
	}

	const modelOutput = await presentMomentStructuredOutput({
		surface: input.surface,
		payload: input.payload,
		safetyLock: input.safetyLock,
	})

	const validated = validateBrioelaGenerativeUi(modelOutput)
	if (!validated.ok) {
		return null
	}

	const safe = runBrioelaGenerativeUiSafetyFilter(validated.document, input)
	if (!safe.ok) {
		return null
	}

	return safe.document
}
```
