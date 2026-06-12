# Draft: send.push.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/send.push.tool.ts`

Source: `build-guide/12-notifications/06-data-model-and-tools.md`, `00-overview.md`

---

## Intended production file

```typescript
import { tool } from 'ai'
import { z } from '@brioela/shared/zod'
import type { BrainDatabase } from '@/agents/brain/_database'
import { executeSendPush } from '@/agents/brain/_tools/_executables/send.push.executable'

const sendPushSchema = z.object({
	type: z.string().min(1).describe('Notification kind — e.g. recall_alert_confirmed, weekly_food_summary'),
	priority: z.enum(['critical', 'high', 'medium', 'low']),
	title: z.string().min(1),
	body: z.string().min(1),
	content_ref: z.string().optional().describe('Stable ref for notification_log — match id, summary id, etc.'),
	data: z.record(z.string(), z.string()).optional(),
	idempotency_key: z.string().optional(),
})

export function sendPushTool(database: BrainDatabase, userId: string, env: BrainToolEnv) {
	return tool({
		description:
			'Send a push notification to the user after evaluating suppression, quiet hours, daily caps, and active sessions. Critical safety bypasses suppression and quiet hours.',
		parameters: sendPushSchema,
		execute: async (args) => executeSendPush(database, userId, args, env),
	})
}
```

Executable calls `evaluateDeliveryRules` then `sendPlatformPush` or inserts `notification_queue`.
