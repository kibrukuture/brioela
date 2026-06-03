import { getDb } from '@/core/database/client';
import { eq } from '@brioela/shared/drizzle';
import { communicationCodes } from '@brioela/shared/drizzle/schema/communication-codes.schema';
import { decryptWithAES256GCM } from '@/core/crypto/decrypt-with-aes-256-gcm';

export async function getUserCommunicationCode(userId: string): Promise<string | null> {
	const db = getDb();

	const [result] = await db.select().from(communicationCodes).where(eq(communicationCodes.userId, userId)).limit(1);

	if (!result) {
		return null;
	}

	try {
		return decryptWithAES256GCM(result.encryptedCode);
	} catch (error) {
		console.error('[Email] Failed to decrypt communication code:', error);
		return null;
	}
}
