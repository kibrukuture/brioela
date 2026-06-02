import type { ZeptoClientConfig } from '@/core/email/types';

export async function getEmailClient(): Promise<ZeptoClientConfig> {
	return { url: process.env.ZEPTOMAIL_URL, token: process.env.ZEPTOMAIL_TOKEN };
}
