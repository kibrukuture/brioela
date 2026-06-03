import crypto from 'crypto';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext
 */
export function encryptWithAES256GCM(plaintext: string): string {
	if (!process.env.ENCRYPTION_KEY) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'ENCRYPTION_KEY is not defined in environment variables' });
	}
	const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
	const iv = crypto.randomBytes(12); // Unique IV per encryption

	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
	let encrypted = cipher.update(plaintext, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag().toString('hex');

	// Format: iv:authTag:ciphertext
	return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
