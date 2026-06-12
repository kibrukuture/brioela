# Draft: vision.detect.pantry.items.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/vision.detect.pantry.items.handler.ts`

**Gap (feature 34):** GPT-4o mini structured detection for fridge/pantry images. Reuses **24**/**33** vision pattern.

**Source:** `build-guide/14-pantry-meal-plan/01-pantry-snapshot.md`

---

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'

export const PantryVisionDetectionSchema = z.object({
  items: z.array(
    z.object({
      itemLabel: z.string().min(1),
      confidence: z.number().min(0).max(1),
      quantityEstimate: z.string().optional(),
    }),
  ),
})

export type PantryVisionDetection = z.infer<typeof PantryVisionDetectionSchema>

type DetectPantryItemsInput = {
  imageBase64: string
  mimeType: string
}

export async function detectPantryItemsFromImage(
  input: DetectPantryItemsInput,
): Promise<PantryVisionDetection> {
  const { object } = await generateObject({
    model: 'gpt-4o-mini',
    schema: PantryVisionDetectionSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'List visible food ingredients in this fridge or pantry photo. Include confidence 0-1 and optional quantity estimate.',
          },
          {
            type: 'image',
            image: `data:${input.mimeType};base64,${input.imageBase64}`,
          },
        ],
      },
    ],
  })

  return object
}
```

Blocked: **24**/**33** vision infrastructure (G5).
