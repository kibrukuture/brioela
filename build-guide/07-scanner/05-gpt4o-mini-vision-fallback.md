# Scanner — GPT-4o Mini Vision Fallback

## What This File Covers

What happens when no barcode is detected: server-side GPT-4o mini vision extraction, front-label classification, the confidence schema for uncertain results, and how menu scanning reuses this pattern.

---

## When Vision Fallback Triggers

The mobile client monitors the camera frame. If no barcode is detected within 3 seconds of the camera being pointed at a product, the client switches to GPT-4o mini vision extraction automatically — no user action required.

```typescript
// mobile/features/scanner/hooks/use.scanner.hook.ts

const BARCODE_TIMEOUT_MS = 3000

useIsomorphicLayoutEffect(() => {
  const timeout = setTimeout(() => {
    // No barcode detected in 3 seconds — capture frame and send for vision extraction
    if (!barcodeDetected.current) {
      captureFrameForVisionExtraction()
    }
  }, BARCODE_TIMEOUT_MS)

  return () => clearTimeout(timeout)
}, [cameraReady])
```

The captured frame is a JPEG at 80% quality — large enough for text extraction, small enough for fast upload. The endpoint is different from the barcode path:

```typescript
// Mobile sends to: POST /api/scans/vision-extract
// Body: { imageBase64, geoHash, capturedAt }
```

---

## Server-Side GPT-4o Mini Vision Pipeline

Vision extraction runs server-side with GPT-4o mini and Zod-enforced structured output. The model must return structured data matching the schema; product safety logic never trusts free-form prose.

```typescript
// backend/src/api/scan/_handlers/vision-extract.scan.handler.ts

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const VisionExtractionResultSchema = z.object({
  productName:   z.string().nullable(),
  brand:         z.string().nullable(),
  ingredients:   z.array(z.string()),
  nutrients:     z.record(z.number()).nullable(),
  confidence:    z.number().min(0).max(1),
  extractedText: z.string(),    // full raw text extracted from the image
  warnings:      z.array(z.string()),  // 'low_light' | 'partial_label' | 'non_food_item' etc.
})

const VISION_EXTRACTION_PROMPT = `
Analyze this product label image. Extract:
1. Product name
2. Brand name
3. Ingredients list (as an array of individual ingredients)
4. Nutritional information (as key-value pairs, values in per-100g)
5. Your confidence in the extraction (0.0–1.0)
6. Any warnings about image quality or extraction completeness

Return valid JSON matching this schema exactly. If a field cannot be determined, use null.
Never invent ingredients or nutritional values that are not clearly visible in the image.
If the image does not appear to be a food product label, set confidence to 0 and all fields to null.
`

export async function visionExtractScan(c: AppContext) {
  const userId = c.get('userId')
  const body   = await c.req.json()

  const { imageBase64, geoHash, capturedAt } = body

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: VisionExtractionResultSchema,
    prompt: VISION_EXTRACTION_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_EXTRACTION_PROMPT },
          { type: 'image', image: `data:image/jpeg;base64,${imageBase64}` },
        ],
      },
    ],
  })

  const parsed = VisionExtractionResultSchema.safeParse(object)

  if (!parsed.success || !parsed.data.productName || parsed.data.confidence < 0.4) {
    // Cannot extract enough information from this image
    return {
      verdict: null,
      status:  'vision_extraction_failed',
      message: 'Could not read product information from this image. Try moving closer or improving the lighting.',
    }
  }

  const extractedData = parsed.data

  // Attempt to match the extracted product name + brand against the Supabase products table
  // This may resolve to a known product without needing a UPC
  const matched = await matchByNameAndBrand(extractedData.productName, extractedData.brand, c.env)

  if (matched) {
    // Known product found — run full constraint check and return verdict
    const constraintResult = await checkConstraints(matched, userId, c.env)
    const verdict          = buildVerdict(matched, constraintResult)
    return { verdict, product: matched, constraintResult, visionExtractionConfidence: extractedData.confidence }
  }

  // No known product matched — build a synthetic product from the extracted label data
  // and score it directly without a canonical product ID
  const syntheticProduct: Product = {
    id:          `vision:${crypto.randomUUID()}`,
    upc:         null,
    name:        extractedData.productName,
    brand:       extractedData.brand,
    ingredients: extractedData.ingredients,
    nutrients:   extractedData.nutrients ?? {},
    additives:   [],
    allergens:   [],
    originCountry: null,
    imageUrl:    null,
    source:      'gpt4o_mini_vision_extraction',
    sourceRefs:  [],
    resolvedAt:  Date.now(),
  }

  const constraintResult = await checkConstraints(syntheticProduct, userId, c.env)
  const verdict          = buildVerdict(syntheticProduct, constraintResult)

  return {
    verdict,
    product:       syntheticProduct,
    constraintResult,
    visionExtractionConfidence: extractedData.confidence,
    isVisionExtracted: true,   // UI shows confidence caveat when this is true
  }
}
```

---

## Confidence Schema — Uncertainty in the UI

When a scan result is vision-extracted (no UPC), the confidence level drives what the UI shows:

| Confidence | UI treatment |
|---|---|
| >= 0.85 | Normal scan result — no caveat shown |
| 0.65–0.84 | "Based on label scan — verify ingredients before consuming" shown below verdict |
| 0.40–0.64 | "Low confidence scan — ingredient list may be incomplete" shown, red regardless of score |
| < 0.40 | Scan fails, user sees: "Couldn't read this label — try a barcode or better lighting" |

The confidence caveat is never hidden. A user with a hard allergy needs to know when the product information source is uncertain.

---

## Contrast Enhancement for Low-Light Labels

Before passing the image to GPT-4o mini, a server-side contrast pass runs:

```typescript
// backend/src/api/scan/_helpers/enhance.image.helper.ts

import sharp from 'sharp'

export async function enhanceForVisionExtraction(imageBase64: string): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64')

  const enhanced = await sharp(buffer)
    .greyscale()                     // convert to greyscale — removes color noise
    .normalise()                     // normalize brightness levels
    .sharpen({ sigma: 1.5 })         // sharpen edges for text readability
    .jpeg({ quality: 90 })
    .toBuffer()

  return enhanced.toString('base64')
}
```

This improves GPT-4o mini extraction accuracy on dimly lit store shelves. Always runs before the model call.

---

## Menu Scanning Reuses This Pipeline

Restaurant menu scanning (`build-guide/17-menu-scanning/`) uses the same vision extraction infrastructure — the GPT-4o mini vision call, contrast enhancement, and confidence schema. Menu scanning adds a menu-specific prompt that identifies dishes rather than products, and returns per-dish verdicts rather than a single product verdict.

The shared code lives in `backend/src/api/scan/_helpers/`:
- `enhance.image.helper.ts` — both scanner and menu scanning use this
- The GPT-4o mini model call pattern — menu scanning follows the same pattern with a different prompt

Menu scanning does NOT share the product resolution layer (Open Food Facts, Redis cache, Supabase products table). Menus return dishes, not barcode-linked products.

---

## Folder Structure — Complete Scanner Feature

```
backend/src/api/scan/
├── scan.route.ts
├── scan.controller.ts
├── _handlers/
│   ├── resolve.scan.handler.ts    ← barcode path (POST /api/scans/resolve)
│   ├── vision-extract.scan.handler.ts ← vision extraction path (POST /api/scans/vision-extract)
│   ├── get.scan.handler.ts        ← GET /api/scans/:id
│   ├── list.scan.handler.ts       ← GET /api/scans/history
│   └── index.ts
├── _helpers/
│   ├── resolve.product.helper.ts  ← Open Food Facts + Redis cache + Supabase
│   ├── check.constraints.helper.ts ← calls Orchestrator DO
│   ├── build.verdict.helper.ts    ← score computation + verdict construction
│   ├── enhance.image.helper.ts    ← contrast enhancement for vision extraction
│   └── index.ts
└── index.ts

tools/product-scan/
├── check-constraint.ts            ← runs inside Orchestrator DO
├── log-scan-event.ts              ← writes to memory_event inside Orchestrator DO
└── index.ts
```
