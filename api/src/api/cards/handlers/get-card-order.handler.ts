import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCardOrders } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { getCardOrderResponseSchema } from '@schnl/shared/validators/card-order.validator';
import { cardOrderIdParamSchema } from '@schnl/shared/validators/card.validator';

export async function getCardOrder(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const paramValidation = cardOrderIdParamSchema.safeParse({ orderId: c.req.param('orderId') });
	if (!paramValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: paramValidation.error.issues[0].message });
	}
	const { orderId } = paramValidation.data;

	const db = getDb();
	const [order] = await db
		.select()
		.from(bankingCardOrders)
		.where(and(eq(bankingCardOrders.userId, user.id), eq(bankingCardOrders.id, orderId)))
		.limit(1);

	if (!order) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Order not found' });

	const validation = getCardOrderResponseSchema.safeParse({
		order: {
			id: order.id,
			type: order.type,
			status: order.status,
			feeType: order.feeType,
			amountAtomic: order.amountAtomic.toString(),
			currency: order.currency,
			cardId: order.cardId ?? null,
			providerTransferId: order.providerTransferId ?? null,
			providerTxHash: order.providerTxHash ?? null,
			shippingAddress: order.shippingAddress ?? null,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString(),
		},
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
