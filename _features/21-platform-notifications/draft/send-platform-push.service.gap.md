# Draft: send-platform-push.ts (gap — file does not exist)

Target: `backend/src/core/notifications/send-platform-push.ts`

**Gap:** Unified send entry for all product features. Wraps `sendOneSignalPush` with extended fields; optionally delegates rule checks to Brain before send.

---

## Intended production file

```typescript
import { sendOneSignalPush } from '@/core/clients/onesignal';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type SendPlatformPushInput = {
	userId: string;
	type: string;
	priority: NotificationPriority;
	title: string;
	body: string;
	data?: Record<string, string>;
	idempotencyKey?: string;
	collapseId?: string;
	ttlSeconds?: number;
};

export type SendPlatformPushResult =
	| { status: 'sent'; providerId: string }
	| { status: 'queued'; queueId: string }
	| { status: 'suppressed'; reason: string }
	| { status: 'skipped'; reason: 'low_priority_no_push' | 'daily_cap' | 'quiet_hours' };

/**
 * Low-level send — callers must have already passed Brain delivery rules
 * unless priority is critical (caller responsibility documented in spec).
 */
export async function sendPlatformPush(input: SendPlatformPushInput): Promise<SendPlatformPushResult> {
	if (input.priority === 'low') {
		return { status: 'skipped', reason: 'low_priority_no_push' };
	}

	const data: Record<string, string> = {
		type: input.type,
		priority: input.priority,
		...input.data,
	};

	// TODO: extend sendOneSignalPush to accept idempotency_key, collapse_id, ttl, priority
	const res = await sendOneSignalPush({
		userId: input.userId,
		title: input.title,
		body: input.body,
		data,
	});

	return { status: 'sent', providerId: res.id };
}
```

**Brain-orchestrated path:** Product code calls Brain `send-push` tool → `evaluate.delivery.rules` → this function or `queue-notification`.
