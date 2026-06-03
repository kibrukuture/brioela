import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingWallets } from '@brioela/shared/drizzle/schema/banking-wallets.schema';
import { bankingWalletSessions } from '@brioela/shared/drizzle/schema/banking-wallet-sessions.schema';
import { and, eq } from '@brioela/shared/drizzle';
import dayjs from 'dayjs';
import { sessionStatusResponseSchema } from '@brioela/shared/validators/banking.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function getSessionStatus(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();

	const [wallet] = await db
		.select()
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, user.id), eq(bankingWallets.isPrimary, true)))
		.limit(1);

	if (!wallet) {
		return sessionStatusResponseSchema.parse({ status: 'missing' });
	}

	const [session] = await db
		.select()
		.from(bankingWalletSessions)
		.where(and(eq(bankingWalletSessions.walletId, wallet.id), eq(bankingWalletSessions.status, 'active')))
		.limit(1);

	if (!session) {
		return sessionStatusResponseSchema.parse({ status: 'missing', walletAddress: wallet.address });
	}

	const now = dayjs();
	const expiresAt = dayjs(session.expiresAt);

	if (expiresAt.isBefore(now)) {
		await db
			.update(bankingWalletSessions)
			.set({ status: 'expired', updatedAt: new Date() })
			.where(eq(bankingWalletSessions.id, session.id));

		return sessionStatusResponseSchema.parse({
			status: 'expired',
			walletAddress: wallet.address,
			sessionKeyAddress: session.sessionKeyAddress,
			expiresAt: session.expiresAt,
		});
	}

	return sessionStatusResponseSchema.parse({
		status: 'active',
		walletAddress: wallet.address,
		sessionKeyAddress: session.sessionKeyAddress,
		expiresAt: session.expiresAt,
	});
}
