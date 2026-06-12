# Draft: present-moment.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/present-moment.ts`

**Gap (feature 52):** AI tool / structured output — single code path for HTTP and agentic.

**Source:** `13-how-ai-selects.md`

---

```typescript
import type { GenerativeSurface } from '@brioela/shared/grammar/schema/surfaces'
import { buildCatalogInputSchema } from './build-catalog-schema'
import { getLlmClient } from '@/core/ai/clients'
import { grammarSystemPrompt } from './prompts/grammar-system'

export type PresentMomentInput = {
	surface: GenerativeSurface
	payload: Record<string, unknown>
	safetyLock: boolean
}

export const PRESENT_MOMENT_TOOL_NAME = 'present_moment' as const

export async function presentMomentStructuredOutput(
	input: PresentMomentInput,
): Promise<unknown> {
	const inputSchema = buildCatalogInputSchema(input.surface)
	const client = getLlmClient()

	const result = await client.generateStructured({
		system: grammarSystemPrompt,
		messages: [
			{
				role: 'user',
				content: JSON.stringify({
					surface: input.surface,
					safetyLock: input.safetyLock,
					payload: input.payload,
				}),
			},
		],
		schema: inputSchema,
		toolName: PRESENT_MOMENT_TOOL_NAME,
	})

	return result
}
```
