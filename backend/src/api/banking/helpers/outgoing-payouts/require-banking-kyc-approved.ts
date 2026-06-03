import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { eq } from '@schnl/shared/drizzle';
import type { Tx } from '@/api/banking/helpers/ledger/types';

export async function requireBankingKycApproved(params: { tx: Tx; userId: string }): Promise<void> {
	const [dbUser] = await params.tx
		.select({ id: users.id, bankingKycStatus: users.bankingKycStatus })
		.from(users)
		.where(eq(users.id, params.userId))
		.limit(1);

	if (!dbUser?.id) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });

	if (dbUser.bankingKycStatus !== 'approved') {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Identity verification required. Please complete KYC first.',
		});
	}
}
