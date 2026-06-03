import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingVirtualAccounts } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { removeVirtualAccountSchema } from '@schnl/shared/validators/banking.validator';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import VirtualAccountRemovedTemplate from '@/core/email/templates/virtual-account-removed.template';
import { renderToString } from 'hono/jsx/dom/server';
import { sendEmail } from '@/core/email/send';

export async function removeVirtualAccount(c: AppContext) {
	const user = c.get('user');
	if (!user) {
		throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}

	const body = await c.req.json();
	const parsed = removeVirtualAccountSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});
	}

	const db = getDb();

	const [dbUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
	if (!dbUser?.email) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });
	}

	if (dbUser.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
		throw new HTTPException(ErrorCode.FORBIDDEN, { message: 'Email does not match your account' });
	}

	const [existing] = await db
		.select({ id: bankingVirtualAccounts.id, providerId: bankingVirtualAccounts.providerId })
		.from(bankingVirtualAccounts)
		.where(and(eq(bankingVirtualAccounts.userId, user.id), eq(bankingVirtualAccounts.currency, parsed.data.currency)))
		.limit(1);

	if (!existing) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Virtual account not found' });
	}

	await db.delete(bankingVirtualAccounts).where(eq(bankingVirtualAccounts.id, existing.id));

	// TODO: remove from Align

	const html = renderToString(VirtualAccountRemovedTemplate({ currency: parsed.data.currency.toUpperCase() }));
	const emailResult = await sendEmail({
		to: dbUser.email,
		subject: `Removed ${parsed.data.currency.toUpperCase()} account`,
		html,
	});

	if (!emailResult.success) {
		throw new HTTPException(ErrorCode.BAD_GATEWAY, {
			message: emailResult.error ?? 'Failed to send confirmation email',
		});
	}

	return { currency: parsed.data.currency, removed: true };
}
