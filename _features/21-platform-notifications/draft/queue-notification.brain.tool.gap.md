# Draft: queue.notification.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/queue.notification.tool.ts`

Source: `build-guide/12-notifications/02-delivery-rules.md` (active session queueing)

---

## Intended production file

```typescript
import { tool } from 'ai'
import { z } from '@brioela/shared/zod'
import type { BrainDatabase } from '@/agents/brain/_database'
import { executeQueueNotification } from '@/agents/brain/_tools/_executables/queue.notification.executable'

const queueNotificationSchema = z.object({
	type: z.string().min(1),
	priority: z.enum(['critical', 'high', 'medium', 'low']),
	title: z.string().min(1),
	body: z.string().min(1),
	payload: z.record(z.string(), z.unknown()).optional(),
	earliest_deliver_at: z.number().describe('Epoch ms — usually session end or quiet hours end'),
	expires_at: z.number().optional().describe('Epoch ms — drop stale queue entries'),
})

export function queueNotificationTool(database: BrainDatabase, userId: string) {
	return tool({
		description:
			'Queue a non-critical notification for delivery after the current active session ends or when quiet hours allow.',
		parameters: queueNotificationSchema,
		execute: async (args) => executeQueueNotification(database, userId, args),
	})
}
```

Drain hook: **11** `closeSession` or dedicated `drainNotificationQueue` on last blocking session end.
