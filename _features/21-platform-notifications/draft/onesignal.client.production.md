# Draft: onesignal.ts — production snapshot

Target: `backend/src/core/clients/onesignal.ts`

**As of migration audit.** Used by stress-test endpoint; intended to become the sole product send path via `send-platform-push.ts`.

```typescript
import * as OneSignal from '@onesignal/node-onesignal';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

let onesignalClient: OneSignal.DefaultApi | null = null;
function createOneSignal() {
	if (onesignalClient) return onesignalClient;
	const configuration = OneSignal.createConfiguration({
		restApiKey: process.env.ONESIGNAL_REST_API_KEY,
	});

	onesignalClient = new OneSignal.DefaultApi(configuration);
	return onesignalClient;
}

export async function sendOneSignalPush(input: {
	userId: string;
	title: string;
	body: string;
	data?: Record<string, string>;
}): Promise<{ id: string }> {
	const client = createOneSignal();
	const notification: OneSignal.Notification = {
		app_id: process.env.ONESIGNAL_APP_ID,
		target_channel: 'push',
		headings: { en: input.title },
		contents: { en: input.body },
		include_aliases: { external_id: [input.userId] },
		data: input.data,
	};

	const res = await client.createNotification(notification);
	if (typeof res.id !== 'string') {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Invalid OneSignal response: missing id' });
	}
	return { id: res.id };
}
```

**Gap extensions for product send:** `idempotency_key`, `collapse_id`, `priority`, `ttl` per `02-medication-reminders.md` — not in shipped client.
