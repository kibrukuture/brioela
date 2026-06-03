import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { eq } from '@brioela/shared/drizzle';
import { communicationCodes } from '@brioela/shared/drizzle/schema/communication-codes.schema';
import { decryptWithAES256GCM } from '@/core/crypto/decrypt-with-aes-256-gcm';

export async function getCommunicationCode(c: AppContext) {
	const user = c.get('user');
	const db = getDb();

	const [result] = await db.select().from(communicationCodes).where(eq(communicationCodes.userId, user.id)).limit(1);

	if (!result) {
		return null;
	}

	const decryptedCode = decryptWithAES256GCM(result.encryptedCode);

	return {
		code: decryptedCode,
		updatedAt: result.updatedAt.toISOString(),
	};
}
