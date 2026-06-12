# Draft: analyze.plate.vision.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/analyze.plate.vision.helper.ts`

**Gap (feature 48):** Workflow step 1 — plate vision extraction. Reuses **24** GPT-4o mini structured pattern; plate-specific prompt.

**Source:** `build-guide/31-encore/02-reconstruction-workflow.md`, `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`

---

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from '@brioela/shared/zod'

const plateVisionExtractionSchema = z.object({
	dishNameGuess: z.string().nullable(),
	visibleComponents: z.array(
		z.object({
			name: z.string(),
			confidence: z.number().min(0).max(1),
			estimated: z.boolean(),
		}),
	),
	cookingMethods: z.array(z.string()),
	garnishes: z.array(z.string()),
	techniqueNotes: z.array(z.string()),
	portionStructure: z.string().optional(),
})

export type PlateVisionExtraction = z.infer<typeof plateVisionExtractionSchema>

const PLATE_VISION_PROMPT = `
You are analyzing a photo of a plated dish for recipe reconstruction.
Return structured components, evident cooking methods (sear, braise, char, emulsion),
garnishes, and technique notes inferred from visual evidence only.
Mark uncertain quantities and unidentified components with estimated=true.
Never fabricate certainty.
`

export async function analyzePlateVision(input: {
	imageUrls: string[]
}): Promise<PlateVisionExtraction> {
	const { object } = await generateObject({
		model: openai('gpt-4o-mini'),
		schema: plateVisionExtractionSchema,
		messages: [
			{ role: 'system', content: PLATE_VISION_PROMPT },
			{
				role: 'user',
				content: input.imageUrls.map((url) => ({
					type: 'image' as const,
					image: url,
				})),
			},
		],
	})

	return object
}
```
