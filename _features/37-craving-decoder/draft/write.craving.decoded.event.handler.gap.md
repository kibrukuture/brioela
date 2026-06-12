# Draft: write.craving.decoded.event.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/craving-decoder/write.craving.decoded.event.handler.ts`

**Gap:** No validated writer for `craving_decoded` memory events.

**Source:** `brioela-specs/52-craving-decoder.md` Learning Loop

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { writeMemoryEvent } from '@/agents/brain/_repositories/write.memory.event.repository'
import {
  CRAVING_DECODED_EVENT_KIND,
  CravingDecodedPayloadSchema,
  type CravingDecodedPayload,
} from '@brioela/shared/validator/craving-decoder/craving.decoded.event.schema'
import { createId } from '@/ids/create.id'

export type WriteCravingDecodedEventInput = {
  userId: string
  sessionId: string | null
  payload: CravingDecodedPayload
  capturedAt?: number
  entityId?: string
}

export async function writeCravingDecodedEvent(
  db: BrainSqlite,
  input: WriteCravingDecodedEventInput,
): Promise<{ id: string }> {
  if (input.payload.disorderedEatingGuardTriggered) {
    throw new Error('craving_decode_blocked_by_guard')
  }

  const payload = CravingDecodedPayloadSchema.parse(input.payload)

  const id = createId()
  await writeMemoryEvent(db, {
    id,
    userId: input.userId,
    kind: CRAVING_DECODED_EVENT_KIND,
    payloadJson: JSON.stringify(payload),
    capturedAt: input.capturedAt ?? Date.now(),
    ingestedAt: Date.now(),
    source: 'craving_decoder',
    sessionId: input.sessionId,
    entityKind: payload.productId ? 'product' : null,
    entityId: payload.productId ?? input.entityId ?? null,
    geoHash: null,
  })

  return { id }
}
```
