# Draft: disconnect.wearable.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/disconnect.wearable.handler.ts`

**Source:** `build-guide/20-wearables/06-privacy-disconnect.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { readWearableConnectionById } from '@/agents/brain/_repositories/read.wearable.connection.by.id.repository'
import { updateWearableConnectionStatus } from '@/agents/brain/_repositories/write.wearable.connection.repository'
import { deleteWearableDataByConnection } from '@/agents/brain/_handlers/wearables/delete.wearable.data.handler'
import { flagWearablePersonalityTraits } from '@/agents/brain/_handlers/wearables/flag.wearable.personality.traits.helper'
import { writeWearableAuditEvent } from '@/agents/brain/_repositories/write.wearable.audit.event.repository'

type DisconnectInput = {
  userId: string
  connectionId: string
  deleteStoredData: boolean
}

export async function disconnectWearable(db: BrainSqlite, input: DisconnectInput): Promise<void> {
  const connection = await readWearableConnectionById(db, {
    userId: input.userId,
    connectionId: input.connectionId,
  })
  if (!connection) return

  await updateWearableConnectionStatus(db, {
    connectionId: input.connectionId,
    status: 'disconnected',
    disconnectedAt: Date.now(),
    credentialsJson: null,
  })

  if (input.deleteStoredData) {
    await deleteWearableDataByConnection(db, {
      userId: input.userId,
      connectionId: input.connectionId,
    })
    await flagWearablePersonalityTraits(db, {
      userId: input.userId,
      connectionId: input.connectionId,
    })
  }

  await writeWearableAuditEvent(db, {
    userId: input.userId,
    eventType: 'device_disconnected',
    connectionId: input.connectionId,
    payloadJson: JSON.stringify({ deleteStoredData: input.deleteStoredData }),
  })
}
```
