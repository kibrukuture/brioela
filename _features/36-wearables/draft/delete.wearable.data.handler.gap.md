# Draft: delete.wearable.data.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/delete.wearable.data.handler.ts`

**Source:** `build-guide/20-wearables/06-privacy-disconnect.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { deleteHealthCapturesByConnection } from '@/agents/brain/_repositories/delete.health.captures.by.connection.repository'
import { deleteGlucoseMealWindowsByConnection } from '@/agents/brain/_repositories/delete.glucose.windows.by.connection.repository'
import { deactivateUserMemoryByConnection } from '@/agents/brain/_repositories/deactivate.user.memory.by.connection.repository'
import { writeWearableAuditEvent } from '@/agents/brain/_repositories/write.wearable.audit.event.repository'

type DeleteInput = {
  userId: string
  connectionId: string
}

export async function deleteWearableDataByConnection(
  db: BrainSqlite,
  input: DeleteInput,
): Promise<void> {
  await deleteHealthCapturesByConnection(db, input)
  await deleteGlucoseMealWindowsByConnection(db, input)
  await deactivateUserMemoryByConnection(db, {
    ...input,
    source: 'wearable',
  })

  await writeWearableAuditEvent(db, {
    userId: input.userId,
    eventType: 'data_deleted',
    connectionId: input.connectionId,
    payloadJson: JSON.stringify({ scope: 'connection' }),
  })
}
```

**Note:** `user_memory` entries deactivated (`is_active = 0`), not hard-deleted per **06-brain-memory** rules.
