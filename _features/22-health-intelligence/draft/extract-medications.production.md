# Draft: extract-medications.ts — production snapshot

Target: `backend/src/core/ai/functions/extract-medications.ts`

**Relevance:** Prescription text extraction exists; not wired to Brain `medications` table. Vision path should reuse `MedicationSchema` after label/PDF extract.

```typescript
import { AppContext } from '@/index';
import { makeStructuredCompletion } from '@/core/ai/utils/structured-completion';
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config';
import { AI_FUNCTION_TEMPERATURE, AI_FUNCTION_MAX_TOKENS } from '@/core/ai/config/ai-models.config';

import { getExtractMedicationsPrompt } from '@/core/ai/prompts/extract-medications.prompt';
import { MedicationSchema } from '@/core/ai/schemas';

export async function extractMedications(c: AppContext, text: string) {
	const prompt = getExtractMedicationsPrompt(text);

	return makeStructuredCompletion(c, {
		model: AI_FUNCTION_MODELS.extractMedications,
		temperature: AI_FUNCTION_TEMPERATURE.extractMedications,
		maxTokens: AI_FUNCTION_MAX_TOKENS.extractMedications,
		functionName: 'extract_medications',
		functionDescription: 'Extract medications from a prescription',
		schema: MedicationSchema,
		systemPrompt: prompt.system,
		userPrompt: prompt.user,
	});
}
```
