import { AppContext } from '@/index';
import getAlignClient from '@/core/clients/align';
import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { eq } from '@schnl/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function getKycLink(c: AppContext) {
	const user = c.get('user');
	if (!user || !user.email)
		throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized: Email required for banking features' });
	const align = getAlignClient();
	const db = getDb();
	const [dbUser] = await db
		.select({
			bankingCustomerId: users.bankingCustomerId,
		})
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	if (!dbUser?.bankingCustomerId) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Identity verification required. Please complete your profile setup first.',
		});
	}
	const customer = await align.customers.get(dbUser.bankingCustomerId);
	if (customer.kycs?.kyc_flow_link) {
		return { kycLink: customer.kycs.kyc_flow_link };
	}
	const session = await align.customers.createKycSession(customer.customer_id);
	return { kycLink: session.kycs.kyc_flow_link };
}
