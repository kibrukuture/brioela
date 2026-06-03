import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';

export default async function assertUserKycApproved(db: ReturnType<typeof getDb>, userId: string) {
	const [dbUser] = await db
		.select({
			bankingCustomerId: users.bankingCustomerId,
			bankingKycStatus: users.bankingKycStatus,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!dbUser?.bankingCustomerId) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Identity verification required. Please complete your profile setup first.',
		});
	}

	if (dbUser.bankingKycStatus !== 'approved') {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Identity verification required. Please complete KYC to create bank accounts.',
		});
	}

	return {
		bankingCustomerId: dbUser.bankingCustomerId,
		bankingKycStatus: dbUser.bankingKycStatus,
	};
}
