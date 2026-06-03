import { AppContext } from '@/index';
import { eq, and } from '@schnl/shared/drizzle';
import { devices } from '@schnl/shared/drizzle/schema/devices.schema';
import { getDb } from '@/core/database/client';
import { bindDeviceSchema, verifyDeviceSchema } from '@schnl/shared/validators/device.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function bindDevice(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();

	const validated = bindDeviceSchema.safeParse(body);

	if (!validated.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: 'Invalid payload: ' + validated.error.message });
	}

	const db = getDb();
	// Remove existing entry for this user/device, then insert trusted
	await db.delete(devices).where(and(eq(devices.userId, user.id), eq(devices.deviceId, validated.data.deviceId)));

	const now = new Date();
	const [inserted] = await db
		.insert(devices)
		.values({
			userId: user.id,
			deviceId: validated.data.deviceId,
			platform: validated.data.platform,
			model: validated.data.model,
			fingerprint: validated.data.fingerprint,
			pushToken: validated.data.pushToken,
			trusted: true,
			boundAt: now,
			lastVerifiedAt: now,
		})
		.returning();

	return inserted;
}

export async function verifyDevice(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const validated = verifyDeviceSchema.safeParse(body);
	if (!validated.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: 'Invalid payload: ' + validated.error.message });
	}

	if (!body?.deviceId) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: 'deviceId is required' });
	}

	const db = getDb();
	const [device] = await db
		.select()
		.from(devices)
		.where(
			and(
				eq(devices.userId, user.id),
				eq(
					devices.deviceId,

					//
					validated.data.deviceId
				),
				eq(devices.trusted, true)
			)
		)
		.limit(1);

	if (!device) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Device not trusted' });
	}

	await db.update(devices).set({ lastVerifiedAt: new Date() }).where(eq(devices.id, device.id));

	return { status: 'ok', deviceId: body.deviceId };
}

export async function unbindDevice(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const validated = verifyDeviceSchema.safeParse(body);
	if (!validated.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: 'Invalid payload: ' + validated.error.message });
	}

	if (!body?.deviceId) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: 'deviceId is required' });
	}

	const db = getDb();
	await db.delete(devices).where(
		and(
			eq(devices.userId, user.id),
			eq(
				devices.deviceId,

				//
				validated.data.deviceId
			)
		)
	);

	return { status: 'removed', deviceId: validated.data.deviceId };
}
