import crypto from 'crypto';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

/**
 * Decrypts AES-256-GCM encrypted data.
 * @param encryptedData - Encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decryptWithAES256GCM(encryptedData: string): string {
	if (!process.env.ENCRYPTION_KEY) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'ENCRYPTION_KEY is not defined in environment variables' });
	}
	const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
	const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');

	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
