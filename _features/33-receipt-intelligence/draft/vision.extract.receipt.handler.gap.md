# Draft: vision.extract.receipt.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/vision.extract.receipt.handler.ts`

**Source:** `build-guide/13-receipt-intelligence/02-gpt4o-mini-vision-and-normalization.md`, `07-scanner/05-gpt4o-mini-vision-fallback.md`

---

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  receiptVisionExtractionSchema,
  type ReceiptVisionExtraction,
} from '@brioela/shared/validator/receipt/receipt.vision.schema'
import { AI_FUNCTION_MODELS } from '@/core/ai/config/ai-models.config'

const RECEIPT_VISION_PROMPT = `
Analyze this grocery receipt image. Extract merchant, datetime, subtotal, tax, total, currency, and line items.
Return valid JSON matching the schema exactly.
Never invent line items not visible on the receipt.
If the image is not a receipt, set confidence to 0 and line_items to [].
`

export async function visionExtractReceipt(input: {
  imageBase64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
}): Promise<ReceiptVisionExtraction> {
  const { object } = await generateObject({
    model: openai(AI_FUNCTION_MODELS.receiptVision ?? 'gpt-4o-mini'),
    schema: receiptVisionExtractionSchema,
    messages: [
      { role: 'system', content: RECEIPT_VISION_PROMPT },
      {
        role: 'user',
        content: [
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

**Reuse:** Same `generateObject` + Zod pattern as **24** scanner vision — separate prompt and schema.
