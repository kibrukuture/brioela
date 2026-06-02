import getAlignClient from '@/core/clients/align';
import { getDb } from '@/core/database/client';
import {
	bankingCustomerAddresses,
	bankingCustomerKyc,
	bankingCustomerKycRailApprovals,
	bankingKycEvents,
	users,
} from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import type { WebhookEvent } from '@tolbel/align';
import { alignCustomerSchema } from '@schnl/shared/validators/align-customer.validator';
import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { BANKING_PROVIDERS } from '@schnl/shared/constants/banking-providers';

export async function onCustomerKycsUpdated(event: WebhookEvent) {
	const db = getDb();
	const customerId = event.entity_id;
	const eventCreatedAt = event.created_at ? dayjs(event.created_at).toDate() : dayjs().toDate();

	const [dbUser] = await db
		.select({
			id: users.id,
		})
		.from(users)
		.where(eq(users.bankingCustomerId, customerId))
		.limit(1);

	if (!dbUser?.id) {
		await db.insert(bankingKycEvents).values({
			userId: null,
			provider: BANKING_PROVIDERS.ALIGN,
			providerCustomerId: customerId,
			eventType: event.event_type,
			payload: event,
		});

		return {
			processed: false,
			message: 'User not found for customer_id',
		};
	}

	const align = getAlignClient();
	const customer = await align.customers.get(customerId);
	const customerValidation = alignCustomerSchema.safeParse(customer);
	if (!customerValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: customerValidation.error.issues[0]?.message ?? 'Invalid Align customer payload',
		});
	}
	const validatedCustomer = customerValidation.data;
	const kycs = validatedCustomer.kycs;
	const customerAddress = validatedCustomer.address;
	const kycStatus = kycs?.status ?? 'not_started';

	await db.transaction(async (tx) => {
		await tx.insert(bankingKycEvents).values({
			userId: dbUser.id,
			provider: BANKING_PROVIDERS.ALIGN,
			providerCustomerId: customerId,
			eventType: event.event_type,
			payload: validatedCustomer,
		});

		await tx
			.insert(bankingCustomerKyc)
			.values({
				userId: dbUser.id,
				provider: BANKING_PROVIDERS.ALIGN,
				providerCustomerId: customerId,
				customerType: validatedCustomer.type,
				status: kycStatus,
				subStatus: kycs?.sub_status ?? null,
				kycFlowLink: kycs?.kyc_flow_link ?? null,
				email: validatedCustomer.email ?? null,
				firstName: validatedCustomer.first_name ?? null,
				lastName: validatedCustomer.last_name ?? null,
				updatedAt: eventCreatedAt,
			})
			.onConflictDoUpdate({
				target: [bankingCustomerKyc.userId, bankingCustomerKyc.provider],
				set: {
					providerCustomerId: customerId,
					customerType: validatedCustomer.type,
					status: kycStatus,
					subStatus: kycs?.sub_status ?? null,
					kycFlowLink: kycs?.kyc_flow_link ?? null,
					email: validatedCustomer.email ?? null,
					firstName: validatedCustomer.first_name ?? null,
					lastName: validatedCustomer.last_name ?? null,
					updatedAt: eventCreatedAt,
				},
			});

		if (customerAddress) {
			await tx
				.insert(bankingCustomerAddresses)
				.values({
					userId: dbUser.id,
					provider: BANKING_PROVIDERS.ALIGN,
					providerCustomerId: customerId,
					streetLine1: customerAddress.street_line_1 ?? null,
					city: customerAddress.city ?? null,
					postalCode: customerAddress.postal_code ?? null,
					country: customerAddress.country ?? null,
					state: customerAddress.state ?? null,
					updatedAt: eventCreatedAt,
				})
				.onConflictDoUpdate({
					target: [bankingCustomerAddresses.userId, bankingCustomerAddresses.provider],
					set: {
						providerCustomerId: customerId,
						streetLine1: customerAddress.street_line_1 ?? null,
						city: customerAddress.city ?? null,
						postalCode: customerAddress.postal_code ?? null,
						country: customerAddress.country ?? null,
						state: customerAddress.state ?? null,
						updatedAt: eventCreatedAt,
					},
				});
		}

		for (const breakdown of kycs?.status_breakdown ?? []) {
			await tx
				.insert(bankingCustomerKycRailApprovals)
				.values({
					userId: dbUser.id,
					provider: BANKING_PROVIDERS.ALIGN,
					providerCustomerId: customerId,
					currency: breakdown.currency,
					rail: breakdown.payment_rails,
					status: breakdown.status,
					updatedAt: eventCreatedAt,
				})
				.onConflictDoUpdate({
					target: [bankingCustomerKycRailApprovals.userId, bankingCustomerKycRailApprovals.currency, bankingCustomerKycRailApprovals.rail],
					set: {
						provider: BANKING_PROVIDERS.ALIGN,
						providerCustomerId: customerId,
						status: breakdown.status,
						updatedAt: eventCreatedAt,
					},
				});
		}

		await tx
			.update(users)
			.set({
				bankingKycStatus: kycStatus,
				bankingKycUpdatedAt: eventCreatedAt,
			})
			.where(eq(users.id, dbUser.id));
	});

	return {
		processed: true,
		userId: dbUser.id,
		bankingKycStatus: kycStatus,
	};
}
