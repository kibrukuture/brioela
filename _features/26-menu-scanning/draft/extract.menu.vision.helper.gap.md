# Gap snapshot: extract.menu.vision.helper.ts

Target: `backend/src/api/menu-scans/_helpers/extract.menu.vision.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/02-menu-gpt4o-mini-vision-and-parsing.md`, `07-scanner/05`.

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { Env } from '@/types/env'
import { enhanceForVisionExtraction } from './enhance.image.helper'

const MenuVisionPageSchema = z.object({
  pageIndex: z.number().int().nonnegative(),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(
    z.enum(['low_light', 'glare', 'partial_page', 'text_too_small', 'vision_extraction_uncertain']),
  ),
})

const MenuVisionExtractionResultSchema = z.object({
  pages: z.array(MenuVisionPageSchema),
  combinedText: z.string(),
  minConfidence: z.number().min(0).max(1),
})

const MENU_VISION_PROMPT = `
Extract all visible restaurant menu text from this image.
Return pageIndex, full extracted text, confidence 0-1, and warnings for image quality issues.
Do not invent menu items not visible in the image.
If this is not a menu, return empty text and confidence 0.
`

export type MenuVisionExtractionResult = z.infer<typeof MenuVisionExtractionResultSchema>

async function extractSinglePage(
  imageBase64: string,
  pageIndex: number,
  env: Env,
): Promise<z.infer<typeof MenuVisionPageSchema>> {
  const enhanced = await enhanceForVisionExtraction(imageBase64)

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: MenuVisionPageSchema.omit({ pageIndex: true }),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: MENU_VISION_PROMPT },
          { type: 'image', image: `data:image/jpeg;base64,${enhanced}` },
        ],
      },
    ],
  })

  void env

  return MenuVisionPageSchema.parse({ ...object, pageIndex })
}

export async function extractMenuVisionPages(
  imagesBase64: string[],
  env: Env,
): Promise<MenuVisionExtractionResult> {
  const pages = await Promise.all(
    imagesBase64.map((image, index) => extractSinglePage(image, index, env)),
  )

  const combinedText = pages.map((p) => p.text).join('\n\n--- page break ---\n\n')
  const minConfidence = pages.length === 0 ? 0 : Math.min(...pages.map((p) => p.confidence))

  return MenuVisionExtractionResultSchema.parse({ pages, combinedText, minConfidence })
}
```

**Shared with 24:** `enhanceForVisionExtraction` — ship once, import from shared module or scan helper.
