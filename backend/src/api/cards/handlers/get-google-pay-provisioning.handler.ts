import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCards } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { cardIdParamSchema } from '@brioela/shared/validators/card.validator';
import { cardWalletProvisioningResponseSchema } from '@brioela/shared/validators/card-wallet-provisioning.validator';
import dayjs from 'dayjs';

export async function getGooglePayProvisioning(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const paramValidation = cardIdParamSchema.safeParse({ cardId: c.req.param('cardId') });
	if (!paramValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: paramValidation.error.issues[0].message });
	}
	const { cardId } = paramValidation.data;

	const db = getDb();
	const existing = await db
		.select({ id: bankingCards.id })
		.from(bankingCards)
		.where(and(eq(bankingCards.userId, user.id), eq(bankingCards.id, cardId)))
		.limit(1);

	if (existing.length === 0) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Card not found' });

	const validation = cardWalletProvisioningResponseSchema.safeParse({
		cardId,
		platform: 'google_pay',
		message: 'Google Pay provisioning is not enabled yet',
		expiresAt: dayjs().add(5, 'minute').toISOString(),
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
