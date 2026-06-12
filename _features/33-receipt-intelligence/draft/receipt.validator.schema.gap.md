# Draft: receipt.schema.ts (shared validator — gap)

Target: `shared/validator/receipt/receipt.schema.ts`

**Source:** `brioela-specs/06-receipt-spend-intelligence.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const receiptIngestRequestSchema = z.object({
  image_base64: z.string().min(1),
  captured_at: z.number().int().positive().optional(),
  geo_hash: z.string().length(6).optional(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
  source: z.enum(['camera', 'share_sheet', 'bela', 'shop_visit']).default('camera'),
  source_ref: z.string().optional(),
})

export const receiptLineItemResponseSchema = z.object({
  id: z.string(),
  raw_label: z.string(),
  normalized_label: z.string().nullable(),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  line_total: z.number().nullable(),
  matched_product_id: z.string().nullable(),
  match_confidence: z.number().nullable(),
  resolution: z.enum(['matched_product', 'matched_category', 'unresolved']),
})

export const receiptDetailResponseSchema = z.object({
  receipt_id: z.string(),
  status: z.enum(['processing', 'normalized', 'unresolved', 'failed']),
  merchant_name: z.string().nullable(),
  captured_at: z.number(),
  subtotal: z.number().nullable(),
  total: z.number(),
  currency: z.string(),
  line_items: z.array(receiptLineItemResponseSchema),
  unresolved_line_count: z.number().int().nonnegative(),
  healthy_spend: z.number().nullable(),
  non_healthy_spend: z.number().nullable(),
})

export type ReceiptIngestRequest = z.infer<typeof receiptIngestRequestSchema>
export type ReceiptDetailResponse = z.infer<typeof receiptDetailResponseSchema>
```
