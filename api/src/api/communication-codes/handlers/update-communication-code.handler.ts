import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { communicationCodes } from '@schnl/shared/drizzle/schema/communication-codes.schema';
import { encryptWithAES256GCM } from '@/core/crypto/encrypt-with-aes-256-gcm';
import { setCommunicationCodeSchema } from '@schnl/shared/validators/communication-code.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function updateCommunicationCode(c: AppContext) {
	const user = c.get('user');
	const body = await c.req.json();

	const validation = setCommunicationCodeSchema.safeParse(body);
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: validation.error.issues[0]?.message ?? 'Invalid payload',
			cause: validation.error,
		});
	}

	const { code } = validation.data;
	const db = getDb();
	const encryptedCode = encryptWithAES256GCM(code);

	const [existing] = await db.select().from(communicationCodes).where(eq(communicationCodes.userId, user.id)).limit(1);

	let result;
	if (existing) {
		[result] = await db
			.update(communicationCodes)
			.set({
				encryptedCode,
				updatedAt: new Date(),
			})
			.where(eq(communicationCodes.userId, user.id))
			.returning();
	} else {
		[result] = await db
			.insert(communicationCodes)
			.values({
				userId: user.id,
				encryptedCode,
			})
			.returning();
	}

	return {
		code,
		updatedAt: result.updatedAt.toISOString(),
	};
}
