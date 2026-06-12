# Draft: generate.kids.scan.explanation.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/kids.mode/generate.kids.scan.explanation.helper.ts`

**Gap:** No secondary LLM call after **24** verdict.

**Source:** `build-guide/21-kids-mode/02-scan-explanation.md`

---

```typescript
import { generateObject } from 'ai'
import { kidsScanExplanationSchema, type KidsModeAgeRange, type KidsScanExplanation } from '@/shared/validator/kids.mode/kids.scan.explanation.schema'
import { buildKidsExplanationPrompt } from './build.kids.explanation.prompt.helper'
import { validateKidsExplanationSafety } from './validate.kids.explanation.safety.helper'

export type ScanSnapshotForKidsExplanation = {
	scanEventId: string
	productName: string
	verdictLevel: 'green' | 'yellow' | 'red'
	verdictReason: string
	keyIngredients: string[]
	sourceConfidence: number
	hasHardAllergyMatch: boolean
	allergySummary: string | null
}

type GenerateKidsScanExplanationInput = {
	ageRange: KidsModeAgeRange
	snapshot: ScanSnapshotForKidsExplanation
}

export async function generateKidsScanExplanation(
	input: GenerateKidsScanExplanationInput,
): Promise<KidsScanExplanation> {
	const { system, user } = buildKidsExplanationPrompt(input)

	const { object } = await generateObject({
		model: 'anthropic/claude-sonnet-4-20250514',
		schema: kidsScanExplanationSchema,
		system,
		prompt: user,
	})

	const safety = validateKidsExplanationSafety(object)
	if (!safety.ok) {
		throw new Error(`Kids explanation failed safety check: ${safety.reason}`)
	}

	return object
}
```
