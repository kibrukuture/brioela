# Gap snapshot: vision-extract.scan.handler.ts

Target: `backend/src/api/scan/_handlers/vision-extract.scan.handler.ts`

**Status:** Not in repo. From `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`.

---

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { enhanceForVisionExtraction } from '../_helpers/enhance.image.helper'
import { matchByNameAndBrand } from '../_helpers/match.product.by.name.helper'
import { buildResolvedProductFactSnapshot } from '../_helpers/product-fact-snapshot.helper'
import { getProductCommunityHealthSummary } from '../_helpers/community-health-summary.helper'
import { checkConstraints } from '../_helpers/check.constraints.helper'
import { checkConditions } from '../_helpers/check.conditions.helper'
import { buildVerdict } from '../_helpers/build.verdict.helper'
import type { AppContext } from '@/index'

const VisionExtractionResultSchema = z.object({
  productName: z.string().nullable(),
  brand: z.string().nullable(),
  ingredients: z.array(z.string()),
  nutrients: z.record(z.number()).nullable(),
  confidence: z.number().min(0).max(1),
  extractedText: z.string(),
  warnings: z.array(z.string()),
})

export async function visionExtractScan(c: AppContext) {
  const userId = c.get('userId')
  const { imageBase64, geoHash, capturedAt } = await c.req.json()

  const enhanced = await enhanceForVisionExtraction(imageBase64)

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: VisionExtractionResultSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_EXTRACTION_PROMPT },
          { type: 'image', image: `data:image/jpeg;base64,${enhanced}` },
        ],
      },
    ],
  })

  const parsed = VisionExtractionResultSchema.safeParse(object)
  if (!parsed.success || !parsed.data.productName || parsed.data.confidence < 0.4) {
    return {
      verdict: null,
      status: 'vision_extraction_failed',
      message:
        'Could not read product information from this image. Try moving closer or improving the lighting.',
    }
  }

  const extracted = parsed.data
  const matched = await matchByNameAndBrand(extracted.productName, extracted.brand, c.env)

  if (matched) {
    const productFactSnapshot = await buildResolvedProductFactSnapshot(matched, c.env)
    const communityHealth = await getProductCommunityHealthSummary(matched.id, c.env)
    const constraintResult = await checkConstraints(productFactSnapshot, userId, c.env)
    const conditionEvaluation = await checkConditions(
      productFactSnapshot,
      userId,
      crypto.randomUUID(),
      c.env,
    )
    const verdict = buildVerdict(
      productFactSnapshot,
      constraintResult,
      communityHealth,
      conditionEvaluation.conditionFlags,
    )
    return {
      verdict,
      product: matched,
      visionExtractionConfidence: extracted.confidence,
      isVisionExtracted: true,
    }
  }

  const syntheticProduct = {
    id: `vision:${crypto.randomUUID()}`,
    upc: null,
    name: extracted.productName,
    brand: extracted.brand,
    ingredients: extracted.ingredients,
    nutrients: extracted.nutrients ?? {},
    additives: [],
    allergens: [],
    source: 'gpt4o_mini_vision_extraction',
    resolvedAt: Date.now(),
  }

  const productFactSnapshot = await buildResolvedProductFactSnapshot(syntheticProduct, c.env)
  const constraintResult = await checkConstraints(productFactSnapshot, userId, c.env)
  const conditionEvaluation = await checkConditions(
    productFactSnapshot,
    userId,
    crypto.randomUUID(),
    c.env,
  )
  const verdict = buildVerdict(
    productFactSnapshot,
    constraintResult,
    null,
    conditionEvaluation.conditionFlags,
  )

  return {
    verdict,
    product: syntheticProduct,
    visionExtractionConfidence: extracted.confidence,
    isVisionExtracted: true,
  }
}
```

**Shared with 26:** `enhance.image.helper.ts` — menu scanning reuses, different prompt.
