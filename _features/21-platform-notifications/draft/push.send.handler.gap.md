# Draft: push.send.handler (gap — route not mounted)

Target: `backend/src/api/notifications/push.send.controller.ts` + route wiring

**Gap:** `shared/api/notifications.routes.ts` defines `push.send` at `/v1/notifications/push/send` but `notif.routes.ts` does not register it.

---

## Intended handler

```typescript
import type { AppContext } from '@/index';
import { apiSuccessResponse, apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { pushSendSchema } from '@brioela/shared/validators/notifications.validator';
import { sendPlatformPush } from '@/core/notifications/send-platform-push';

export async function onPushSend(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) {
		return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Unauthorized'), 401);
	}

	const body = await c.req.json();
	const parsed = pushSendSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(apiErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid payload', parsed.error.flatten()), 400);
	}

	// Product decision: authenticated user can only send to self in v1
	// Admin/service sends go through Brain internal RPC or stress-test

	if ('template_id' in parsed.data) {
		return c.json(apiErrorResponse(ErrorCode.NOT_IMPLEMENTED, 'Templates not supported in v1'), 501);
	}

	const result = await sendPlatformPush({
		userId: user.id,
		type: parsed.data.data?.type ?? 'generic',
		priority: (parsed.data.data?.priority as 'medium') ?? 'medium',
		title: parsed.data.title,
		body: parsed.data.body,
		data: parsed.data.data,
	});

	if (result.status === 'sent') {
		return c.json(apiSuccessResponse({ status: 'queued', requestId: result.providerId }));
	}

	return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, result.status, result), 409);
}
```

**Alternative:** Remove `push.send` from shared routes if all sends are Brain-internal only — close G3 either way.
