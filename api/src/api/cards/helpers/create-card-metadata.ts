import crypto from 'crypto';
import dayjs from 'dayjs';

export function createCardMetadata(): { last4: string; expiryMonth: number; expiryYear: number } {
	const last4 = crypto.randomInt(0, 10000).toString().padStart(4, '0');
	const expiryMonth = crypto.randomInt(1, 13);
	const expiryYear = dayjs().year() + 3;
	return { last4, expiryMonth, expiryYear };
}
