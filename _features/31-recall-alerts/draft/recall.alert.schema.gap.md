# Gap snapshot: recall.alert.schema.ts

Target: `shared/validator/recall/recall.alert.schema.ts`

**Status:** Not in repo. From `build-guide/02-coding-standards/08-shared-package-zod.md`, `15-recall-alerts/`.

---

```typescript
import { z } from 'zod'

export const RecallSourceSchema = z.enum(['fda', 'efsa', 'cfia', 'rasff'])
export const RecallEntryStatusSchema = z.enum(['active', 'retracted', 'expired'])
export const MatchConfidenceSchema = z.enum(['confirmed', 'probable', 'informational'])

export const RecallEntrySchema = z.object({
  id: z.string().uuid(),
  recallId: z.string().min(1),
  source: RecallSourceSchema,
  productName: z.string().min(1),
  upc: z.string().nullable(),
  lotNumbersJson: z.array(z.string()),
  reason: z.string().min(1),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  rawNoticeUrl: z.string().url(),
  status: RecallEntryStatusSchema,
})

export const RecallScanMatchSchema = z.object({
  id: z.string().uuid(),
  recallId: z.string().uuid(),
  userId: z.string().min(1),
  scanEventId: z.string().uuid().nullable(),
  productExposureId: z.string().uuid().nullable(),
  matchConfidence: MatchConfidenceSchema,
  notifiedAt: z.string().datetime().nullable(),
  resolvedAt: z.string().datetime().nullable(),
})

export const RecallAlertDetailSchema = RecallScanMatchSchema.extend({
  recall: RecallEntrySchema,
  productName: z.string(),
  productPhotoUrl: z.string().url().nullable(),
  scannedLot: z.string().nullable(),
  scannedAt: z.string().datetime().nullable(),
})

export const ResolveRecallAlertInputSchema = z.object({
  matchId: z.string().uuid(),
})

export const BrainRecallMatchPayloadSchema = z.object({
  userId: z.string().min(1),
  matchId: z.string().uuid(),
  recallEntryId: z.string().uuid(),
  matchConfidence: MatchConfidenceSchema,
  productName: z.string(),
  reason: z.string(),
  scannedAt: z.string().datetime().optional(),
  idempotencyKey: z.string().min(1),
})

export type RecallEntry = z.output<typeof RecallEntrySchema>
export type RecallScanMatch = z.output<typeof RecallScanMatchSchema>
export type RecallAlertDetail = z.output<typeof RecallAlertDetailSchema>
export type BrainRecallMatchPayload = z.output<typeof BrainRecallMatchPayloadSchema>
```

**Push `type` mapping (31 → 21):**

| `matchConfidence` | `data.type` |
|---|---|
| `confirmed` | `recall_alert_confirmed` |
| `probable` | `recall_alert_probable` |
| `informational` | in-app only — no push |
