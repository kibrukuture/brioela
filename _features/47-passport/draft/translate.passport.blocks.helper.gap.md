# Draft: translate.passport.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/translate.passport.blocks.helper.ts`

**Gap (feature 47):** Meaning-preserving translation for `travel_translation` and local restaurant use.

**Source:** `build-guide/28-passport/05-translation-and-display.md`

---

```typescript
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export type TranslatePassportBlocksInput = {
	blocks: InstructionBlock[]
	sourceLanguage: string
	targetLanguage: string
}

export type TranslatePassportBlocksResult = {
	blocks: InstructionBlock[]
	sourceLanguage: string
	targetLanguage: string
}

export async function translatePassportBlocks(
	input: TranslatePassportBlocksInput,
): Promise<TranslatePassportBlocksResult> {
	// TODO: structured LLM call — translate instruction blocks only
	// Rules: preserve food-safety meaning; no hidden source data; ingredient names clear
	// Never translate content not present in input blocks

	if (input.sourceLanguage === input.targetLanguage) {
		return {
			blocks: input.blocks,
			sourceLanguage: input.sourceLanguage,
			targetLanguage: input.targetLanguage,
		}
	}

	// Placeholder: identity until LLM wired
	return {
		blocks: input.blocks,
		sourceLanguage: input.sourceLanguage,
		targetLanguage: input.targetLanguage,
	}
}
```
