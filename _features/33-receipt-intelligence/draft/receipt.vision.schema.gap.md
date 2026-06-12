# Draft: receipt.vision.schema.ts (gap — file does not exist)

Target: `shared/validator/receipt/receipt.vision.schema.ts`

**Source:** `build-guide/13-receipt-intelligence/02-gpt4o-mini-vision-and-normalization.md`, `07-scanner/05-gpt4o-mini-vision-fallback.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const receiptVisionLineSchema = z.object({
  raw_label: z.string(),
  quantity: z.number().positive().nullable(),
  unit_price: z.number().nonnegative().nullable(),
  line_total: z.number().nonnegative().nullable(),
  upc: z.string().nullable(),
  merchant_sku: z.string().nullable(),
})

export const receiptVisionExtractionSchema = z.object({
  extracted_text: z.string(),
  merchant_candidate: z.string().nullable(),
  datetime_candidate: z.string().nullable(),
  subtotal: z.number().nonnegative().nullable(),
  tax: z.number().nonnegative().nullable(),
  total: z.number().nonnegative().nullable(),
  currency_candidate: z.string().nullable(),
  line_items: z.array(receiptVisionLineSchema),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
})

export type ReceiptVisionExtraction = z.infer<typeof receiptVisionExtractionSchema>
```

Product logic reads only validated fields. Schema failure → receipt `unresolved`, retriable.
