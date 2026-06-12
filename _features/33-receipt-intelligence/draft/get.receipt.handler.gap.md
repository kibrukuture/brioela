# Draft: get.receipt.handler.ts (gap — file does not exist)

Target: `backend/src/api/receipt/_handlers/get.receipt.handler.ts`

**Source:** `build-guide/13-receipt-intelligence/06-receipt-ui-and-voice.md`

---

```typescript
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import { receiptDetailResponseSchema } from '@brioela/shared/validator/receipt/receipt.schema'
import type { AppContext } from '@/index'
import { checkReceiptEntitlement } from '@/agents/brain/_helpers/check.receipt.entitlement.helper'

export async function getReceiptById(c: AppContext) {
  const userId = c.get('userId')
  await checkReceiptEntitlement(c, userId)

  const receiptId = c.req.param('id')
  const brain = c.get('brainStub')
  const detail = await brain.getReceiptDetail({ userId, receiptId })

  if (!detail) {
    throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Receipt not found' })
  }

  const validated = receiptDetailResponseSchema.parse(detail)
  return c.json(validated)
}
```

Response includes unresolved lines, matched products, and health spend slice for the receipt period.
