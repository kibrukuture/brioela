import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import {
	bankingCardOrders,
	bankingOfframpOutbox,
	bankingCards,
	bankingCustomerKyc,
	bankingCustomerAddresses,
} from '@schnl/shared/drizzle/schema';
import { createCardOrderRequestSchema } from '@schnl/shared/validators/card-order.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import dayjs from 'dayjs';
import { createHold } from '@/api/banking/helpers/ledger/holds';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { publishOfframpOutboxQueueJob } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-queue-job';
import { getCardOrderFeeAmountAtomic } from '@/api/cards/helpers/get-card-order-fee-amount-atomic';
import { eq } from '@schnl/shared/drizzle';
import { createCardOrderResponseSchema } from '@schnl/shared/validators/card-order.validator';
import { createCardMetadata } from '@/api/cards/helpers/create-card-metadata';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';

export async function createCardOrder(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = createCardOrderRequestSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	const computedFeeAmountAtomic = getCardOrderFeeAmountAtomic({ type: parsed.data.type });
	if (parsed.data.type === 'physical' && computedFeeAmountAtomic === '0') {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Invalid physical card fee configuration' });
	}
	const feeType = parsed.data.type === 'virtual' ? 'virtual_creation' : 'physical_shipping';

	const db = getDb();
	const outbox = await db.transaction(async (tx) => {
		const [kyc] = await tx
			.select({
				status: bankingCustomerKyc.status,
				firstName: bankingCustomerKyc.firstName,
				lastName: bankingCustomerKyc.lastName,
			})
			.from(bankingCustomerKyc)
			.where(eq(bankingCustomerKyc.userId, user.id))
			.limit(1);

		if (kyc?.status !== 'approved' || !kyc.firstName || !kyc.lastName) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
				message: 'Identity verification required. Please complete KYC first.',
			});
		}

		if (parsed.data.type === 'physical') {
			const [customerAddress] = await tx
				.select({
					country: bankingCustomerAddresses.country,
				})
				.from(bankingCustomerAddresses)
				.where(eq(bankingCustomerAddresses.userId, user.id))
				.limit(1);

			const kycCountry = customerAddress?.country;
			if (typeof kycCountry !== 'string' || kycCountry.length === 0) {
				throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
					message: 'Identity verification required. Please complete KYC first.',
				});
			}

			const shippingCountry = parsed.data.shippingAddress?.country;
			if (typeof shippingCountry !== 'string' || shippingCountry.length === 0) {
				throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'country is required' });
			}

			if (shippingCountry.toUpperCase() !== kycCountry.toUpperCase()) {
				throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
					message: 'Shipping country must match your KYC country.',
				});
			}
		}

		const now = dayjs().toDate();
		const [order] = await tx
			.insert(bankingCardOrders)
			.values({
				userId: user.id,
				cardId: null,
				type: parsed.data.type,
				status: 'created',
				feeType,
				amountAtomic: BigInt(computedFeeAmountAtomic),
				currency: 'usd',
				providerTransferId: null,
				providerTxHash: null,
				shippingAddress: parsed.data.shippingAddress ?? null,
				updatedAt: now,
			})
			.returning();

		if (!order?.id) {
			throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to create card order' });
		}

		const isFreeVirtual = order.type === 'virtual' && computedFeeAmountAtomic === '0';

		if (!isFreeVirtual) {
			const expiresAt = dayjs().add(1, 'day').toDate();
			try {
				await createHold({
					tx,
					userId: user.id,
					currency: 'usd',
					amountAtomic: computedFeeAmountAtomic,
					referenceType: BANKING_LEDGER_HOLD_REFERENCE_TYPES.CARD_ORDER,
					referenceId: order.id,
					expiresAt,
					description: `Hold for card order ${order.id}`,
				});

				await createUserActivityTransaction({
					tx,
					userId: user.id,
					type: 'fee',
					direction: 'debit',
					status: 'pending',
					amountAtomic: BigInt(computedFeeAmountAtomic),
					currency: 'usd',
					rail: null,
					referenceType: 'card_order',
					referenceId: order.id,
					description: 'Card order fee',
					category: 'card_fees',
					createdAt: now,
				});
			} catch (e: unknown) {
				if (e instanceof HTTPException && e.message === 'Insufficient available balance') {
					throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
						message: 'Insufficient balance. Please top up money to your account.',
					});
				}
				throw e;
			}
		}

		const { last4, expiryMonth, expiryYear } = createCardMetadata();
		let initialCardStatus: 'pending' | 'active' = 'pending';
		if (isFreeVirtual) {
			initialCardStatus = 'active';
		}
		const [card] = await tx
			.insert(bankingCards)
			.values({
				userId: user.id,
				providerId: `card_order:${order.id}`,
				type: order.type,
				status: initialCardStatus,
				brand: 'visa',
				last4,
				expiryMonth,
				expiryYear,
				currency: 'usd',
				walletAddress: null,
				cardholderFirstName: kyc.firstName,
				cardholderLastName: kyc.lastName,
				label: null,
				theme: null,
				updatedAt: now,
			})
			.returning();

		await tx
			.update(bankingCardOrders)
			.set({ cardId: card?.id ?? null, updatedAt: now })
			.where(eq(bankingCardOrders.id, order.id));

		if (isFreeVirtual) {
			await tx
				.update(bankingCardOrders)
				.set({ status: 'completed', updatedAt: dayjs().toDate() })
				.where(eq(bankingCardOrders.id, order.id));

			return { outboxId: null, orderId: order.id };
		}

		await tx.update(bankingCardOrders).set({ status: 'processing', updatedAt: dayjs().toDate() }).where(eq(bankingCardOrders.id, order.id));

		const [outboxRow] = await tx
			.insert(bankingOfframpOutbox)
			.values({
				referenceType: 'card_order',
				referenceId: order.id,
				payload: {},
				dedupeKey: `card_order:${order.id}`,
			})
			.returning({ id: bankingOfframpOutbox.id });

		return { outboxId: outboxRow?.id ?? null, orderId: order.id };
	});

	if (outbox.outboxId) {
		await publishOfframpOutboxQueueJob({ outboxId: outbox.outboxId });
	}

	const [order] = await db.select().from(bankingCardOrders).where(eq(bankingCardOrders.id, outbox.orderId)).limit(1);

	if (!order) throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to load card order' });

	const validation = createCardOrderResponseSchema.safeParse({
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
