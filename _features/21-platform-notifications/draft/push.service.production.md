# Draft: push.service.ts — production snapshot

Target: `backend/src/api/notifications/push.service.ts`

**As of migration audit (2026-06-12).** Registers device tokens in Postgres and syncs to **Courier** REST API. Spec target is OneSignal-only — see `status.md` G1.

```typescript
import type { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { and, eq } from '@brioela/shared/drizzle';
import { pushNotification } from '@brioela/shared/drizzle/schema/push-notification.schema';
import { pushRegisterSchema, pushUnregisterSchema } from '@brioela/shared/validators/notifications.validator';
import Courier from '@trycourier/courier';
import { HTTPException } from 'hono/http-exception';

export async function registerPushToken(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = pushRegisterSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(400, { message: 'Invalid payload: ' + parsed.error.message });
	}

	const db = getDb();
	const now = new Date();
	await db.delete(pushNotification).where(and(eq(pushNotification.userId, user.id), eq(pushNotification.deviceId, parsed.data.device_id)));

	await db.insert(pushNotification).values({
		userId: user.id,
		deviceId: parsed.data.device_id,
		provider: parsed.data.provider,
		token: parsed.data.token,
		platform: parsed.data.platform,
		model: parsed.data.model,
		active: true,
		registeredAt: now,
		createdAt: now,
		updatedAt: now,
	});

	const authKey = process.env.COURIER_AUTH_KEY;
	if (!authKey) throw new HTTPException(500, { message: 'COURIER_AUTH_KEY is not configured' });
	const providerKey = parsed.data.provider === 'fcm' ? 'firebase-fcm' : parsed.data.provider === 'apns' ? 'apn' : 'expo';
	const url = `https://api.courier.com/users/${encodeURIComponent(user.id)}/tokens/${encodeURIComponent(parsed.data.token)}`;
	const resp = await fetch(url, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${authKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			token: parsed.data.token,
			provider_key: providerKey,
		}),
	});
	if (!resp.ok) {
		const text = await resp.text();
		throw new HTTPException(502, { message: `Courier PUT failed: ${resp.status} ${resp.statusText}: ${text}` });
	}

	return { status: 'ok' };
}

export async function unregisterPushToken(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = pushUnregisterSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(400, { message: 'Invalid payload: ' + parsed.error.message });
	}

	const db = getDb();
	const authKey = process.env.COURIER_AUTH_KEY;
	if (!authKey) throw new HTTPException(500, { message: 'COURIER_AUTH_KEY is not configured' });
	const client = new Courier({ apiKey: authKey });
	const rows = await db
		.select()
		.from(pushNotification)
		.where(and(eq(pushNotification.userId, user.id), eq(pushNotification.deviceId, parsed.data.device_id)));
	if (rows.length > 0) {
		const row = rows[0];
		await client.users.tokens.delete(row.token, {
			user_id: user.id,
		});
	}
	await db.delete(pushNotification).where(and(eq(pushNotification.userId, user.id), eq(pushNotification.deviceId, parsed.data.device_id)));

	return { status: 'removed' };
}
```
