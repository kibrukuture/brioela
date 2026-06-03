import { AppContext } from '@/index';
import { eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { getSupabaseAdmin } from '@/core/database/supabase-admin-client';
import AccountDeletedTemplate from '@/core/email/templates/account-deleted.template';
import { renderToString } from 'hono/jsx/dom/server';
import { EMAIL_FROM } from '@brioela/shared/constants';
import getResendClient from '@/core/clients/resend';
import { getDb } from '@/core/database/client';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { bankingLedgerAccounts } from '@brioela/shared/drizzle/schema';
import { sql } from '@brioela/shared/drizzle';

export async function deleteUser(c: AppContext) {
	const id = c.req.param('id');
	const authUser = c.get('user');
	if (!authUser || authUser.id !== id) {
		throw new HTTPException(ErrorCode.FORBIDDEN, { message: 'Forbidden: cannot delete other users' });
	}

	const db = getDb();
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!user) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });
	}

	const isPayingUser = user?.paymentStatus === 'active' || user?.paymentStatus === 'trialing';
	if (isPayingUser) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Paying users must cancel their subscription first' });
	}

	const [hasBalanceRow] = await db
		.select({ hasBalance: sql<boolean>`true` })
		.from(bankingLedgerAccounts)
		.where(
			sql`${bankingLedgerAccounts.userId} = ${id} AND (${bankingLedgerAccounts.balanceAvailableAtomic} <> 0 OR ${bankingLedgerAccounts.balanceHeldAtomic} <> 0)`
		)
		.limit(1);
	if (hasBalanceRow) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'You must empty all money from your account before deleting it',
		});
	}

	const { error } = await getSupabaseAdmin().auth.admin.deleteUser(id);
	if (error) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: error.message });
	}

	const html = renderToString(<AccountDeletedTemplate name={`${user.firstName ?? ''}`} />);
	await getResendClient().emails.send({
		to: user.email,
		subject: 'Account Deleted',
		html,
		from: EMAIL_FROM.generic,
	});

	return 'User deleted successfully';
}
