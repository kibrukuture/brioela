import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import getAlignClient from '@/core/clients/align';
import { getDb } from '@/core/database/client';
import { bankingKycEvents, users } from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import { BANKING_PROVIDERS } from '@schnl/shared/constants/banking-providers';
import type { PollingJob } from '@schnl/shared/drizzle/schema/polling-jobs.schema';

export async function syncAlignCustomerKycStatus(job: PollingJob) {
	const db = getDb();

	let customerId = job.externalId ?? null;
	let userId = job.internalId ?? null;

	if (!customerId && userId) {
		const [dbUser] = await db.select({ bankingCustomerId: users.bankingCustomerId }).from(users).where(eq(users.id, userId)).limit(1);
		customerId = dbUser?.bankingCustomerId ?? null;
	}

	if (!customerId) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: 'Polling job missing externalId (Align customer id) and cannot derive it from internalId',
		});
	}

	if (!userId) {
		const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.bankingCustomerId, customerId)).limit(1);
		userId = dbUser?.id ?? null;
	}

	const align = getAlignClient();
	const customer = await align.customers.get(customerId);
	const derivedStatus = customer.kycs?.status ?? 'not_started';

	await db.insert(bankingKycEvents).values({
		userId,
		provider: BANKING_PROVIDERS.ALIGN,
		providerCustomerId: customerId,
		eventType: 'polling.kyc-status',
		payload: customer as unknown as Record<string, unknown>,
	});

	if (userId) {
		await db
			.update(users)
			.set({
				bankingKycStatus: derivedStatus,
				bankingKycUpdatedAt: dayjs().toDate(),
			})
			.where(eq(users.id, userId));
	}

	if (derivedStatus === 'approved' || derivedStatus === 'rejected') {
		return { done: true };
	}

	return {
		done: false,
		error: `KYC status: ${derivedStatus}`,
	};
}
