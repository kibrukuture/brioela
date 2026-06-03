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
	const client = new Courier({ apiKey: authKey });
	const providerKey = parsed.data.provider === 'fcm' ? 'firebase-fcm' : parsed.data.provider === 'apns' ? 'apn' : 'expo';
	console.log('push.register courier addSingle', {
		userId: user.id,
		provider_key: providerKey,
		token_len: parsed.data.token.length,
		token_preview: parsed.data.token.slice(0, 8),
	});
	const url = `https://api.courier.com/users/${encodeURIComponent(user.id)}/tokens/${encodeURIComponent(parsed.data.token)}`;
	console.log('push.register courier PUT', { url, provider_key: providerKey });
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
		console.error('push.register courier PUT error', { status: resp.status, statusText: resp.statusText, body: text });
		throw new HTTPException(502, { message: `Courier PUT failed: ${resp.status} ${resp.statusText}: ${text}` });
	}
	console.log('push.register courier PUT success', { status: resp.status });

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

		console.log('push.unregister courier delete', { userId: user.id, token_len: row.token.length, token_preview: row.token.slice(0, 8) });
		try {
			await client.users.tokens.delete(row.token, {
				user_id: user.id,
			});
			console.log('push.unregister courier delete success', { userId: user.id });
		} catch (e) {
			console.error('push.unregister courier delete error', {
				name: e instanceof Error ? e.name : 'Unknown',
				message: e instanceof Error ? e.message : String(e),
				stack: e instanceof Error ? e.stack : undefined,
				userId: user.id,
			});
			throw e;
		}
	}
	console.log('push.unregister deleting db row', { userId: user.id, device_id: parsed.data.device_id });
	await db.delete(pushNotification).where(and(eq(pushNotification.userId, user.id), eq(pushNotification.deviceId, parsed.data.device_id)));

	return { status: 'removed' };
}
