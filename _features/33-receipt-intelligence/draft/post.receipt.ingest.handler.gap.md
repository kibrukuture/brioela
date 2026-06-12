# Draft: post.ingest.handler.ts (gap — file does not exist)

Target: `backend/src/api/receipt/_handlers/post.ingest.handler.ts`

**Source:** `build-guide/13-receipt-intelligence/01-receipt-ingestion.md`

---

```typescript
import { HTTPException } from 'hono/http-exception'
import { createId } from '@paralleldrive/cuid2'
import { ErrorCode } from '@brioela/shared/types/api'
import { receiptIngestRequestSchema } from '@brioela/shared/validator/receipt/receipt.schema'
import type { AppContext } from '@/index'
import { checkReceiptEntitlement } from '@/agents/brain/_helpers/check.receipt.entitlement.helper'
import { uploadReceiptImage } from '@/api/receipt/_helpers/upload.receipt.image.helper'
import { enqueueReceiptProcessJob } from '@/api/receipt/_helpers/enqueue.receipt.process.job.helper'

export async function postReceiptIngest(c: AppContext) {
  const userId = c.get('userId')
  await checkReceiptEntitlement(c, userId)

  const body = await c.req.json()
  const parsed = receiptIngestRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw new HTTPException(ErrorCode.VALIDATION_ERROR, { message: parsed.error.message })
  }

  const receiptId = createId()
  const imageObjectKey = await uploadReceiptImage(c, userId, receiptId, parsed.data)

  const brain = c.get('brainStub')
  await brain.createReceiptPending({
    receiptId,
    userId,
    capturedAt: parsed.data.captured_at ?? Date.now(),
    imageObjectKey,
    geoHash: parsed.data.geo_hash ?? null,
    source: parsed.data.source,
    sourceRef: parsed.data.source_ref ?? null,
  })

  await enqueueReceiptProcessJob(c, { receiptId, userId, imageObjectKey })

  return c.json({ receipt_id: receiptId, status: 'processing' as const }, 202)
}
```

**Note:** `brainStub` placeholder — wire to Brain DO RPC per **04** patterns.
